package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;


    @Value("${spring.mail.username}")
    private String fromEmail;
    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            System.out.println("✅ Đã gửi mail thành công cho: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Lỗi gửi mail: " + e.getMessage());
        }
    }

    // Hàm gửi hàng loạt (Dùng cho Notification cả lớp)
    @Async
    public void sendBulkEmail(List<String> emails, String subject, String body) {
        for (String email : emails) {
            sendEmail(email, subject, body);
        }
    }
}