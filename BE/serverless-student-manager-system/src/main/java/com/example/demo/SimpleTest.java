package com.example.demo;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;

import java.util.HashMap;
import java.util.Map;

public class SimpleTest {

    public static void main(String[] args) {
        System.out.println("⏳ Đang kết nối tới AWS DynamoDB...");

        // 1. CẤU HÌNH (Thay Key của bạn vào đây)
        // LƯU Ý: Access Key và Secret Key này là ví dụ, bạn cần thay bằng key thực tế của bạn nếu key cũ đã bị hủy hoặc không hoạt động.
        String accessKey = "";
        String secretKey = "";

        // Kiểm tra kỹ tên bảng trên AWS Console xem có chính xác không.
        // Trong các bước trước bạn dùng "Student-Management-App", ở đây là "Student-Management-Database".
        // Hãy chắc chắn tên bảng đúng với tên bạn đã tạo trên AWS.
        String tableName = "Student-Management-Database";

        // Region Singapore
        Region region = Region.AP_SOUTHEAST_1;

        try {
            // 2. Tạo Client kết nối
            DynamoDbClient client = DynamoDbClient.builder()
                    .region(region)
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();

            // 3. Chuẩn bị Key để tìm kiếm (Tìm user STUDENT01)
            // Dữ liệu này phải khớp với dữ liệu bạn đã nạp vào bảng bằng seed.js
            Map<String, AttributeValue> keyToGet = new HashMap<>();
            keyToGet.put("PK", AttributeValue.builder().s("USER#STUDENT01").build());
            keyToGet.put("SK", AttributeValue.builder().s("PROFILE").build());

            // 4. Gọi lệnh GetItem
            GetItemRequest request = GetItemRequest.builder()
                    .tableName(tableName)
                    .key(keyToGet)
                    .build();

            GetItemResponse response = client.getItem(request);

            // 5. In kết quả
            if (response.hasItem()) {
                System.out.println("✅ KẾT NỐI THÀNH CÔNG! Tìm thấy dữ liệu:");
                System.out.println("---------------------------------------------");
                Map<String, AttributeValue> item = response.item();

                // In ra vài thông tin cơ bản để kiểm tra
                if(item.containsKey("name")) System.out.println("Tên: " + item.get("name").s());
                if(item.containsKey("email")) System.out.println("Email: " + item.get("email").s());
                if(item.containsKey("roleName")) System.out.println("Role: " + item.get("roleName").s());
                if(item.containsKey("avatar")) System.out.println("Avatar: " + item.get("avatar").s());
                System.out.println("---------------------------------------------");
                System.out.println("Raw Data: " + item);
            } else {
                System.out.println("⚠️ Kết nối OK nhưng không tìm thấy User này.");
                System.out.println("👉 Hãy kiểm tra lại PK/SK xem có khớp với dữ liệu trong bảng không.");
                System.out.println("👉 Kiểm tra lại tên bảng (tableName) và Region.");
            }

        } catch (Exception e) {
            System.err.println("❌ LỖI KẾT NỐI:");
            e.printStackTrace();
        }
    }
}