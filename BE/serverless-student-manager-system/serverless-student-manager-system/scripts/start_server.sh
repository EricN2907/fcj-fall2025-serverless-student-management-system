#!/bin/bash
# Application Start Hook - Khởi động ứng dụng

set -e

echo "=========================================="
echo "Starting Application - $(date)"
echo "=========================================="

# Enable và start service
systemctl enable student-manager
systemctl start student-manager

# Đợi ứng dụng khởi động
echo "Waiting for application to start..."
sleep 30

# Kiểm tra service status
if systemctl is-active --quiet student-manager; then
    echo "Application started successfully"
else
    echo "ERROR: Failed to start application"
    systemctl status student-manager
    exit 1
fi
