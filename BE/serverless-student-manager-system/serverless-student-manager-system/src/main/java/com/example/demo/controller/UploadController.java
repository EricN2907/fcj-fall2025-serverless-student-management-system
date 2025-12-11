package com.example.demo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final S3Presigner s3Presigner;
    @Value("${aws.s3.bucket-name}")
    private String bucketName;
    @GetMapping("/presigned-url")
    public ResponseEntity<?> getPresignedUrl(@RequestParam String fileName) {

        // 1. Tạo tên file duy nhất (tránh trùng lặp)
        String fileKey = "assignments/" + UUID.randomUUID() + "_" + fileName;

        // 2. Tạo yêu cầu Presign
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType("application/octet-stream") // Hoặc dynamic theo đuôi file
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10)) // Link sống 10 phút
                .putObjectRequest(objectRequest)
                .build();

        // 3. Sinh URL
        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
        String uploadUrl = presignedRequest.url().toString();

        // 4. Trả về cho FE
        Map<String, String> response = new HashMap<>();
        response.put("uploadUrl", uploadUrl); // FE dùng link này để PUT file
        response.put("fileKey", fileKey);     // FE dùng key này để gửi API submit

        return ResponseEntity.ok(response);
    }
    @GetMapping("/download-url")
    public ResponseEntity<?> getDownloadUrl(@RequestParam String fileKey) {
        try {
            // 1. Tạo yêu cầu Get Object
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileKey) // Key lấy từ DB (VD: assignments/abc_123.pdf)
                    .build();

            // 2. Tạo yêu cầu Presign (Link sống 60 phút)
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(60))
                    .getObjectRequest(getObjectRequest)
                    .build();

            // 3. Sinh URL
            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String downloadUrl = presignedRequest.url().toString();

            // 4. Trả về
            return ResponseEntity.ok(Collections.singletonMap("downloadUrl", downloadUrl));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Không thể tạo link tải: " + e.getMessage()));
        }
    }
}