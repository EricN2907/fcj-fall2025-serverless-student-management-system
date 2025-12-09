package com.example.demo.dto.Student;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SubmitAssignmentRequest {

    private String class_id;
    private String assignmentId;
    private String content;
    private String fileUrl;
    private String fileName;
}
