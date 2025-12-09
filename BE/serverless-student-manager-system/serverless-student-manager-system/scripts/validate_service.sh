#!/bin/bash
# Validate Service Hook - Kiểm tra ứng dụng đã chạy đúng chưa

set -e

echo "=========================================="
echo "Validating Service - $(date)"
echo "=========================================="

MAX_RETRIES=10
RETRY_INTERVAL=10
HEALTH_CHECK_URL="http://localhost:8080/actuator/health"

# Đợi ứng dụng sẵn sàng
for i in $(seq 1 $MAX_RETRIES); do
    echo "Health check attempt $i of $MAX_RETRIES..."
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "Health check passed! Application is healthy."
        exit 0
    fi
    
    echo "Health check returned status: $HTTP_STATUS. Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
done

echo "ERROR: Health check failed after $MAX_RETRIES attempts"
echo "Service status:"
systemctl status student-manager
echo "Recent logs:"
tail -50 /var/log/student-manager/app.log
exit 1
