#!/bin/bash
# Application Stop Hook - Dừng ứng dụng

echo "=========================================="
echo "Stopping Application - $(date)"
echo "=========================================="

# Dừng service nếu đang chạy
if systemctl is-active --quiet student-manager; then
    echo "Stopping student-manager service..."
    systemctl stop student-manager
    echo "Service stopped"
else
    echo "Service is not running"
fi

# Kill any remaining Java processes (backup)
pkill -f "demo-0.0.1-SNAPSHOT.jar" || true

echo "Application Stop completed"
