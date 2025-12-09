const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");



const client = new DynamoDBClient({ 
    region: "ap-southeast-1", 
    credentials: {
        accessKeyId: "",     
      secretAccessKey: "" 
    }
});


const REGION = "ap-southeast-1"; 
const TABLE_NAME = "SchoolManagementVer2"; 

const docClient = DynamoDBDocumentClient.from(client);

const subjects = [
  {
    code: "SWP391",
    name: "Software Development Project",
    credits: 3,
    department: "SE",
    status: 1,
    date: "2025-12-06T08:00:00" // Ngày hôm nay
  },
  {
    code: "SWR302",
    name: "Software Requirements",
    credits: 3,
    department: "SE",
    status: 1,
    date: "2025-12-06T09:30:00" // Cũng ngày hôm nay (test search cùng ngày)
  },
  {
    code: "PRN211",
    name: "Basic Cross-Platform Application Programming",
    credits: 3,
    department: "SE",
    status: 1,
    date: "2025-12-05T10:00:00" // Ngày hôm qua (để test lọc không ra)
  },
  {
    code: "MKT101",
    name: "Marketing Principles",
    credits: 3,
    department: "IB",
    status: 1,
    date: "2025-12-06T14:00:00" // Khác khoa, cùng ngày
  },
  {
    code: "JPD113",
    name: "Elementary Japanese",
    credits: 3,
    department: "FL",
    status: 1,
    date: "2025-11-20T08:00:00" // Ngày cũ hơn
  }
];

// 3. HÀM CHUYỂN ĐỔI DỮ LIỆU SANG FORMAT DYNAMODB
const mapToItem = (sub) => {
  return {
    // --- Khóa chính (Primary Key) ---
    pk: `SUBJECT#${sub.code}`, // Ví dụ: SUBJECT#SWP391
    
    // --- Khóa phụ cho Search (GSI1) ---
    GSI1PK: "TYPE#SUBJECT",
    GSI1SK: `NAME#${sub.name.toLowerCase()}`, // Để search tương đối
    
    // --- Các thuộc tính khác ---
    id: `SUBJECT#${sub.code}`,
    codeSubject: sub.code,
    name: sub.name,
    credits: sub.credits,
    department: sub.department,
    status: sub.status,
    
    // --- QUAN TRỌNG: Cột created_at mới ---
    created_at: sub.date, // Format ISO 8601 (yyyy-MM-ddTHH:mm:ss)
    
    // Thêm updated_at nếu cần
    updated_at: new Date().toISOString()
  };
};

// 4. HÀM GHI DỮ LIỆU (Batch Write)
const seedData = async () => {
  try {
    const items = subjects.map(mapToItem);
    
    // DynamoDB chỉ cho phép ghi tối đa 25 item mỗi lần Batch
    // Hàm này sẽ chia nhỏ mảng nếu dữ liệu > 25
    const chunks = [];
    while (items.length > 0) {
      chunks.push(items.splice(0, 25));
    }

    console.log(`Bắt đầu ghi ${subjects.length} môn học vào bảng ${TABLE_NAME}...`);

    for (const chunk of chunks) {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map(item => ({
            PutRequest: {
              Item: item
            }
          }))
        }
      });

      await docClient.send(command);
      console.log(`-> Đã ghi thành công batch ${chunk.length} items.`);
    }

    console.log("✅ HOÀN TẤT! Dữ liệu đã được nạp lại với cột created_at.");

  } catch (error) {
    console.error("❌ Lỗi khi ghi dữ liệu:", error);
  }
};

// Chạy script
seedData();