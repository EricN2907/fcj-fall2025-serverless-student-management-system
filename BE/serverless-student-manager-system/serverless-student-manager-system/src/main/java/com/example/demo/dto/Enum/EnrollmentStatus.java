package com.example.demo.dto.Enum;


public enum EnrollmentStatus {
    UNENROLLED(0), // Đã hủy môn / Thôi học
    ENROLLED(1),   // Đang học
    WAITLIST(2);   // Đang chờ (nếu cần)

    private final int value;

    EnrollmentStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    // Hàm helper để convert từ số sang Enum (nếu cần)
    public static EnrollmentStatus fromValue(int value) {
        for (EnrollmentStatus status : EnrollmentStatus.values()) {
            if (status.value == value) {
                return status;
            }
        }
        return UNENROLLED; // Mặc định
    }
}