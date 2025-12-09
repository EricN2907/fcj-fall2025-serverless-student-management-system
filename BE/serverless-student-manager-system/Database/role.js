const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

// Cấu hình AWS (Giữ nguyên như cũ)
const client = new DynamoDBClient({ 
    region: "ap-southeast-1", 
    credentials: {
      accessKeyId: "",     
      secretAccessKey: "" 
    }
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "Student-Management-Database";

const checkAdmin = async (userId) => {
    console.log(`\n🕵️‍♂️  ĐANG SOI USER: ${userId}`);
    try {
        const res = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: userId, SK: "PROFILE" }
        }));
        
        const user = res.Item;

        if (!user) {
            console.log("❌ Không tìm thấy User này trong DB!");
            return;
        }

        console.log("---------------------------------------------");
        // 1. Kiểm tra các biến thể tên cột
        console.log("1️⃣  KIỂM TRA TÊN CỘT (Attribute Name):");
        console.log(`   - role_name (Chuẩn):   ${user.role_name ? `"${user.role_name}"` : "❌ NULL (Chưa có)"}`);
        console.log(`   - roleName (Dư thừa):  ${user.roleName  ? `"${user.roleName}"`  : "✅ Không có"}`);
        console.log(`   - role (Dư thừa):      ${user.role      ? `"${user.role}"`      : "✅ Không có"}`);

        // 2. Kiểm tra giá trị
        console.log("\n2️⃣  KIỂM TRA GIÁ TRỊ (Value):");
        const currentRole = user.role_name;
        if (currentRole === "admin") console.log("   ✅ Giá trị đúng: 'admin' (viết thường)");
        else if (currentRole === "Admin") console.log("   ⚠️ Cảnh báo: 'Admin' (Viết hoa - Code có thể không hiểu)");
        else console.log(`   ❌ Sai: Đang là '${currentRole}' (Phải là 'admin')`);

        // 3. Kiểm tra GSI (Nhóm quyền)
        console.log("\n3️⃣  KIỂM TRA NHÓM (GSI Key):");
        console.log(`   - GSI1PK hiện tại:     "${user.GSI1PK}"`);
        if (user.GSI1PK === "ROLE#ADMIN") console.log("   ✅ GSI Chuẩn (Đã chuyển sang nhóm Admin)");
        else console.log("   ❌ GSI Sai (Vẫn đang nằm ở nhóm cũ, cần sửa thành ROLE#ADMIN)");

        console.log("---------------------------------------------");

    } catch (e) { console.error(e); }
};

// 👇 Thay ID của ông Admin vào đây để check
checkAdmin("USER#290a450c-3061-70ab-8a58-4dd5ff696c24");