package com.example.demo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class SchoolApplication {

    public static void main(String[] args) {
        SpringApplication.run(SchoolApplication.class, args);

        System.out.println("=========================================================");
        System.out.println("✅ Student Management API is running on port 8080...");
        System.out.println("📄 Swagger UI: http://localhost:8080/swagger-ui/index.html");
        System.out.println("=========================================================");
    }

}
