const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand, ScanCommand, DeleteItemCommand } = require("@aws-sdk/lib-dynamodb");

// 1. Cấu hình Client
const client = new DynamoDBClient({ 
    region: "ap-southeast-1", 
    credentials: {
        accessKeyId: "",     
      secretAccessKey: "" 
    }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "Student-Management-Database"; 

// ==========================================
// 2. DỮ LIỆU ĐẦU VÀO (TỪ FILE BẠN GỬI)
// ==========================================

const rawUsers = [
    {
      id: "SE182088", name: "Nguyễn Nhật Kim Ngân", email: "saoaz1029@gmail.com",
      dateOfBirth: "2004-08-29", role: "Student", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Nhật+Kim+Ngân", status: 0
    },
    {
      id: "SE182907", name: "Nguyễn Hoèng Lem", email: "namnhse182076@fpt.edu.vn",
      dateOfBirth: "2004-07-29", role: "Lecturer", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Hoèng+Lem", status: 1
    },
    {
      id: "GV006", name: "Nguyễn Văn Tuấn", email: "lecturer@fpt.edu.vn",
      dateOfBirth: "1999-04-09", role: "Lecturer", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Tuấn", status: 1
    },
     {
    PK: "USER#ADMIN01", SK: "PROFILE",
    GSI1PK: "ROLE#ADMIN", GSI1SK: "USER#ADMIN01",
    name: "Super Admin", email: "admin@fpt.edu", role_name: "admin", status: 1
  },
    {
        id: "GV006", name: "Nguyễn Văn Tuấn", email: "lecturer@fpt.edu.vn",
      dateOfBirth: "1999-04-09", role: "Lecturer", avatar: "https://ui-avatars.com/api/?name=Nguyễn+Văn+Tuấn", status: 1
    }
    
];

const rawClasses = [
    {
      id: "CLASS_09A263E6", name: "OJT", subjectId: "OJT2026", teacherId: "SE182907",
      room: null, semester: "SUMMER", description: "Là kì thực tập mang tiếng nhưng vẫn là game gacha rác"
    },
    {
      id: "CLASS_4D0420B0", name: "PUBG2004", subjectId: "PUBG2004", teacherId: "GV006",
      room: null, semester: "SPRING2026", description: "Nơi các đồng bo đc thể hiện sức mạnh"
    },
    {
      id: "SE1700", name: "SE1700 - swp391", subjectId: "SWP391", teacherId: "GV006",
      room: "BE-401", semester: "2", description: "sdasd"
    },
    {
      id: "SE1702", name: "SE1702 - SWR302", subjectId: "SWR302", teacherId: "GV006", // Sửa GV01 -> GV006 để khớp user
      room: "BE-401", semester: "SPRING2024", description: null
    },
    {
      id: "CLASS_7056D2DE", name: "Valorant", subjectId: "VAL36", teacherId: "SE182907",
      room: null, semester: "Fall2025", description: "Là nơi bạn sẽ được tỏ sáng với game"
    }
];

// ==========================================
// 3. XỬ LÝ & CHUYỂN ĐỔI DỮ LIỆU (MAPPING)
// ==========================================

const generateData = () => {
    const data = [];
    const createdSubjectIds = new Set();

    // --- A. MAP USERS ---
    console.log("⚙️  Đang xử lý Users...");
    rawUsers.forEach(u => {
        data.push({
            PK: `USER#${u.id}`,
            SK: "PROFILE",
            GSI1PK: `ROLE#${u.role.toUpperCase()}`,
            GSI1SK: `NAME#${u.name.toLowerCase()}`,
            id: u.id,
            name: u.name,
            email: u.email,
            role_name: u.role.toLowerCase(),
            date_of_birth: u.dateOfBirth,
            avatar: u.avatar,
            status: u.status
        });
    });

    // --- B. MAP CLASSES & TẠO SUBJECT TỰ ĐỘNG ---
    console.log("⚙️  Đang xử lý Classes & Subjects...");
    rawClasses.forEach(c => {
        // 1. Tạo Class Item
        data.push({
            PK: `CLASS#${c.id}`,
            SK: "INFO",
            GSI1PK: "TYPE#CLASS",
            GSI1SK: `NAME#${c.name.toLowerCase()}`,
            id: c.id,
            name: c.name,
            subject_id: `SUBJECT#${c.subjectId}`, // Liên kết với Subject
            teacher_id: `USER#${c.teacherId}`,   // Liên kết với Teacher
            semester: c.semester,
            room: c.room || "Online",
            description: c.description || "",
            status: 1,
            created_at: new Date().toISOString()
        });

        // 2. Tạo Subject Item (nếu chưa có)
        // Vì trong dữ liệu gốc bạn không gửi list Subject riêng, ta lấy từ Class ra
        if (!createdSubjectIds.has(c.subjectId)) {
            createdSubjectIds.add(c.subjectId);
            data.push({
                PK: `SUBJECT#${c.subjectId}`,
                SK: "INFO",
                GSI1PK: "TYPE#SUBJECT",
                GSI1SK: `NAME#${c.subjectId.toLowerCase()}`,
                id: `SUBJECT#${c.subjectId}`,
                codeSubject: c.subjectId,
                name: c.name.split('-')[1]?.trim() || c.subjectId, // Lấy tên sau dấu - hoặc lấy ID
                credits: 3,
                status: 1
            });
        }
    });

    // --- C. TẠO ENROLLMENT (MỐI QUAN HỆ) ---
    // Giả sử: Cho Student "Kim Ngân" (SE182088) học lớp "PUBG2004" và "Valorant"
    // Đây chính là chỗ giúp bạn query được "Sinh viên này học lớp nào"
    console.log("⚙️  Đang tạo dữ liệu đăng ký học (Enrollment)...");
    
    const studentId = "SE182088"; // Kim Ngân
    const classesToEnroll = ["CLASS_4D0420B0", "CLASS_7056D2DE"]; // PUBG & Valorant

    classesToEnroll.forEach(    classId => {
        data.push({
            PK: `CLASS#${classId}`,           // Partition Key là Lớp
            SK: `STUDENT#${studentId}`,       // Sort Key là Sinh viên
            
            // GSI1 (Đảo ngược để query theo User)
            GSI1PK: `USER#${studentId}`,      // PK phụ là Sinh viên
            GSI1SK: `CLASS#${classId}`,       // SK phụ là Lớp

            joined_at: new Date().toISOString(),
            status: "enrolled"
        });
    });

    return data;
};

// ==========================================
// 4. HÀM GHI VÀO DYNAMODB
// ==========================================
const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

const clearTable = async () => {
    console.log("🧹 Đang quét để xóa dữ liệu cũ (Dev Mode)...");
    // Lưu ý: Chỉ dùng scan + delete cho dev/test data ít. Production không dùng cách này.
    try {
        const scanCmd = new ScanCommand({ TableName: TABLE_NAME, ProjectionExpression: "PK, SK" });
        const res = await docClient.send(scanCmd);
        
        if (res.Items.length > 0) {
            const deleteRequests = res.Items.map(item => ({
                DeleteRequest: { Key: { PK: item.PK, SK: item.SK } }
            }));
            const chunks = chunkArray(deleteRequests, 25);
            for (const chunk of chunks) {
                await docClient.send(new BatchWriteCommand({ RequestItems: { [TABLE_NAME]: chunk } }));
            }
            console.log(`🗑️  Đã xóa ${res.Items.length} items cũ.`);
        }
    } catch (error) {
        console.log("⚠️ Không thể xóa (có thể bảng trống):", error.message);
    }
};

const seedData = async () => {
    try {
        // BƯỚC 1: Xóa dữ liệu cũ (Optional - để sạch data)
        await clearTable(); 

        // BƯỚC 2: Chuẩn bị dữ liệu mới
        const rawData = generateData();
        const chunks = chunkArray(rawData, 25);
        console.log(`📦 Tổng cộng ${rawData.length} dòng dữ liệu cần ghi.`);
        
        // BƯỚC 3: Ghi xuống DB
        let count = 0;
        for (const chunk of chunks) {
            const command = new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: chunk.map((item) => ({ PutRequest: { Item: item } })),
                },
            });
            await docClient.send(command);
            count += chunk.length;
            process.stdout.write(`\r   ✅ Đã ghi: ${count}/${rawData.length}...`);
        }
        console.log(`\n🎉 SEED DATA THÀNH CÔNG!`);
    } catch (err) {
        console.error("\n❌ Lỗi:", err);
    }
};

seedData();