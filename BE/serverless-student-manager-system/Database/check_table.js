const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

// Dán y nguyên config credentials của bạn vào đây
const client = new DynamoDBClient({ 
    region: "ap-southeast-1", 
    credentials: {
        accessKeyId: "",     
        secretAccessKey: "" 
    }
});

const run = async () => {
  try {
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    console.log("------------------------------------------------");
    console.log("🌎 Đang kết nối tới Region:", await client.config.region());
    console.log("📋 Danh sách các bảng tìm thấy:");
    console.log(response.TableNames);
    console.log("------------------------------------------------");
    
    if (response.TableNames.length === 0) {
        console.log("⚠️  CẢNH BÁO: Không tìm thấy bảng nào cả!");
        console.log("👉 Khả năng cao bạn tạo bảng ở Region khác rồi.");
        console.log("👉 Hãy lên Web AWS đổi Region (góc trên phải) xem bảng nằm ở đâu.");
    }
  } catch (err) {
    console.error("❌ Lỗi kết nối:", err);
  }
};

run();