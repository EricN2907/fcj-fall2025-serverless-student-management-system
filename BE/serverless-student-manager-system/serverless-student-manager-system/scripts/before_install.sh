#!/bin/bash
# Before Install Hook - Chuẩn bị môi trường trước khi cài đặt

set -e

echo "=========================================="
echo "Before Install - $(date)"
echo "=========================================="

# Tạo thư mục ứng dụng nếu chưa tồn tại
mkdir -p /opt/student-manager
mkdir -p /var/log/student-manager

# Xóa file JAR cũ nếu có
rm -f /opt/student-manager/*.jar

# Cài đặt Java 17 nếu chưa có
if ! java -version 2>&1 | grep -q "17"; then
    echo "Installing Amazon Corretto 17..."
    yum install -y java-17-amazon-corretto || apt-get install -y openjdk-17-jdk
fi

# Tạo user để chạy ứng dụng (nếu chưa có)
if ! id "studentmanager" &>/dev/null; then
    useradd -r -s /bin/false studentmanager
fi

# Set permissions
chown -R studentmanager:studentmanager /opt/student-manager
chown -R studentmanager:studentmanager /var/log/student-manager

echo "Before Install completed successfully"
