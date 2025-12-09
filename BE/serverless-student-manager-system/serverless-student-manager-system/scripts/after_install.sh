#!/bin/bash
# After Install Hook - Cấu hình sau khi cài đặt

set -e

echo "=========================================="
echo "After Install - $(date)"
echo "=========================================="

APP_DIR="/opt/student-manager"
JAR_FILE="$APP_DIR/demo-0.0.1-SNAPSHOT.jar"

# Kiểm tra file JAR đã được copy
if [ ! -f "$JAR_FILE" ]; then
    echo "ERROR: JAR file not found at $JAR_FILE"
    exit 1
fi

# Set permissions cho JAR file
chmod 755 "$JAR_FILE"
chown studentmanager:studentmanager "$JAR_FILE"

# Tạo systemd service file
cat > /etc/systemd/system/student-manager.service << 'EOF'
[Unit]
Description=Student Manager System - Spring Boot Application
After=network.target

[Service]
Type=simple
User=studentmanager
Group=studentmanager
WorkingDirectory=/opt/student-manager
ExecStart=/usr/bin/java -jar /opt/student-manager/demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=production
ExecStop=/bin/kill -15 $MAINPID
Restart=always
RestartSec=10
StandardOutput=append:/var/log/student-manager/app.log
StandardError=append:/var/log/student-manager/error.log

# Environment variables (có thể lấy từ AWS Parameter Store/Secrets Manager)
Environment="JAVA_OPTS=-Xms512m -Xmx1024m"
Environment="AWS_REGION=ap-southeast-1"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

echo "After Install completed successfully"
