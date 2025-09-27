# Interview Helper - Troubleshooting Guide

This guide helps diagnose and resolve common issues with the Interview Helper application.

## Quick Diagnostics

### Health Check Commands
```bash
# Basic health check
curl http://localhost:4000/health

# Detailed health check
curl http://localhost:4000/health/detailed

# Container status (Docker deployment)
docker-compose ps
docker-compose logs interview-helper

# Process status (Direct deployment)
pm2 status interview-helper
pm2 logs interview-helper
```

## Common Issues

### 1. Application Won't Start

#### Symptoms
- Port binding errors
- Application crashes on startup
- "EADDRINUSE" errors
- Process exits immediately

#### Diagnosis
```bash
# Check if port is in use
netstat -tulpn | grep :4000
lsof -i :4000

# Check environment variables
env | grep -E "(NODE_ENV|PORT|SUPPORT_QUEUE_FILE)"

# Check file permissions
ls -la data/
ls -la server/

# Check application logs
tail -f logs/app.log
docker-compose logs interview-helper
```

#### Solutions

**Port Already in Use:**
```bash
# Find and kill process using port 4000
sudo lsof -t -i:4000 | xargs kill -9

# Or use different port
export PORT=4001
```

**File Permission Issues:**
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER data/
chmod 755 data/
chmod 644 data/support-queue.json
```

**Environment Configuration:**
```bash
# Copy and configure environment file
cp .env.example .env
# Edit .env with correct values
```

### 2. Database/Queue File Issues

#### Symptoms
- "Queue file not found" errors
- Data corruption warnings
- Backup/restore failures
- Invalid JSON errors

#### Diagnosis
```bash
# Check queue file exists and is readable
ls -la data/support-queue.json
cat data/support-queue.json | jq . >/dev/null

# Check data directory structure
tree data/

# Validate queue file format
node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('data/support-queue.json'));
  console.log('Valid JSON, records:', data.length);
} catch(e) {
  console.error('Invalid JSON:', e.message);
}
"
```

#### Solutions

**Missing Queue File:**
```bash
# Create data directory and empty queue
mkdir -p data
echo '[]' > data/support-queue.json
chmod 644 data/support-queue.json
```

**Corrupted Queue File:**
```bash
# Backup current file
cp data/support-queue.json data/support-queue.json.backup

# Try to repair JSON
# If backup exists, restore from it
./scripts/backup.sh list
./scripts/backup.sh restore <backup-file>

# Or create fresh empty queue
echo '[]' > data/support-queue.json
```

**Permission Issues:**
```bash
# Fix permissions
sudo chown -R $USER:$USER data/
find data/ -type f -exec chmod 644 {} \;
find data/ -type d -exec chmod 755 {} \;
```

### 3. Memory Issues

#### Symptoms
- High memory usage
- Out of memory errors
- Slow performance
- Process crashes

#### Diagnosis
```bash
# Check system memory
free -h
htop

# Check Node.js memory usage
curl http://localhost:4000/health/metrics | jq '.system.memory'

# Check for memory leaks
# Monitor over time
watch -n 5 'curl -s http://localhost:4000/health/metrics | jq ".system.memory.heapUsedPercentage"'
```

#### Solutions

**Increase Memory Limit:**
```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# For PM2
pm2 start server/index.js --node-args="--max-old-space-size=2048"

# For Docker
# Add to docker-compose.yml:
# environment:
#   - NODE_OPTIONS=--max-old-space-size=2048
```

**Clean Up Data:**
```bash
# Apply data retention
curl -X POST -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:4000/admin/retention/apply

# Manual cleanup of old logs/exports
find data/exports -mtime +30 -delete
find logs/ -name "*.log" -mtime +7 -delete
```

### 4. Network/Connection Issues

#### Symptoms
- Connection refused errors
- Timeout errors
- CORS errors from frontend
- Rate limiting false positives

#### Diagnosis
```bash
# Test network connectivity
telnet localhost 4000

# Check listening ports
netstat -tulpn | grep node

# Test CORS settings
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:4000/support

# Check rate limiting status
curl -v http://localhost:4000/health
# Look for X-RateLimit-* headers
```

#### Solutions

**CORS Issues:**
```bash
# Update CORS configuration in .env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# Restart application
pm2 restart interview-helper
# or
docker-compose restart interview-helper
```

**Firewall Issues:**
```bash
# Check firewall status
sudo ufw status

# Allow port 4000
sudo ufw allow 4000

# For specific IPs only
sudo ufw allow from 192.168.1.0/24 to any port 4000
```

**Rate Limiting Adjustments:**
```bash
# Temporarily increase limits in .env
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=300000  # 5 minutes

# Or whitelist specific IPs (in nginx.conf)
# set_real_ip_from 192.168.1.0/24;
# real_ip_header X-Forwarded-For;
```

### 5. Performance Issues

#### Symptoms
- Slow response times
- High CPU usage
- Request timeouts
- Queue buildup

#### Diagnosis
```bash
# Monitor response times
time curl http://localhost:4000/health

# Check metrics over time
watch -n 2 'curl -s http://localhost:4000/health/metrics'

# Monitor system resources
htop
iostat 1

# Check request logs for slow endpoints
grep "responseTime" logs/app.log | awk '$NF > 1000'
```

#### Solutions

**Optimize Configuration:**
```bash
# Adjust timeouts in .env
REQUEST_TIMEOUT_MS=60000

# Enable compression (if using nginx)
# gzip on; in nginx.conf

# Increase system limits
# /etc/security/limits.conf
# * soft nofile 65536
# * hard nofile 65536
```

**Scale Application:**
```bash
# Use PM2 cluster mode
pm2 start server/index.js -i max --name interview-helper

# Or scale with Docker
docker-compose up -d --scale interview-helper=3
```

### 6. Docker-Specific Issues

#### Symptoms
- Build failures
- Container crashes
- Volume mounting issues
- Network connectivity problems

#### Diagnosis
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f interview-helper

# Inspect container
docker inspect interview-helper_interview-helper_1

# Check volumes
docker volume ls
docker volume inspect interview-helper_interview_data
```

#### Solutions

**Build Issues:**
```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up -d --build --force-recreate

# Check Dockerfile syntax
docker build --no-cache .
```

**Volume Issues:**
```bash
# Check volume permissions
ls -la data/
sudo chown -R 1001:1001 data/  # Docker user

# Recreate volumes
docker-compose down -v
docker-compose up -d
```

**Network Issues:**
```bash
# Check Docker networks
docker network ls
docker network inspect interview-helper_interview-network

# Restart networking
docker-compose down
docker network prune -f
docker-compose up -d
```

### 7. Authentication Issues (Admin Panel)

#### Symptoms
- 401 Unauthorized responses
- Authentication prompts not appearing
- Invalid credentials errors

#### Diagnosis
```bash
# Test authentication
curl -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:4000/admin/stats

# Check encoded credentials
echo -n "admin:admin123" | base64

# Test without authentication
curl http://localhost:4000/admin/stats
```

#### Solutions

**Update Credentials:**
```bash
# Generate base64 encoded credentials
echo -n "newuser:newpassword" | base64

# Use in requests
curl -H "Authorization: Basic <base64-string>" \
  http://localhost:4000/admin/stats
```

**Browser Issues:**
- Clear browser cache and cookies
- Try incognito/private mode
- Check browser console for errors

### 8. Backup/Restore Issues

#### Symptoms
- Backup creation failures
- Restore errors
- Missing backup files
- Corrupted backups

#### Diagnosis
```bash
# List backups
./scripts/backup.sh list

# Test backup creation
./scripts/backup.sh backup

# Validate backup file
tar -tzf data/backups/backup-file.tar.gz
```

#### Solutions

**Permission Issues:**
```bash
# Fix backup directory permissions
chmod +x scripts/backup.sh
mkdir -p data/backups data/exports
chmod 755 data/backups data/exports
```

**Disk Space Issues:**
```bash
# Check available space
df -h

# Clean up old backups
find data/backups -mtime +30 -delete

# Compress old logs
gzip logs/*.log
```

## Emergency Recovery

### Complete Application Recovery

1. **Stop Application**
   ```bash
   docker-compose down
   # or
   pm2 stop interview-helper
   ```

2. **Backup Current State**
   ```bash
   cp -r data data-backup-$(date +%Y%m%d)
   cp -r logs logs-backup-$(date +%Y%m%d)
   ```

3. **Restore from Backup**
   ```bash
   ./scripts/backup.sh restore <latest-backup>
   ```

4. **Reset to Clean State** (if backups fail)
   ```bash
   # Create fresh data directory
   rm -rf data/
   mkdir -p data/backups data/exports
   echo '[]' > data/support-queue.json
   ```

5. **Restart Application**
   ```bash
   docker-compose up -d
   # or
   pm2 restart interview-helper
   ```

### Data Recovery

If data corruption is suspected:

1. **Stop writing operations**
2. **Create backup of current state**
3. **Analyze data integrity**
   ```bash
   node -e "
   const fs = require('fs');
   const data = JSON.parse(fs.readFileSync('data/support-queue.json'));
   const valid = data.filter(item => item.id && item.email && item.createdAt);
   console.log('Total:', data.length, 'Valid:', valid.length);
   if (valid.length !== data.length) {
     fs.writeFileSync('data/support-queue-cleaned.json', JSON.stringify(valid, null, 2));
     console.log('Cleaned data saved to support-queue-cleaned.json');
   }
   "
   ```
4. **Restore cleaned data if needed**

## Getting Help

### Log Analysis

**Important log locations:**
- Application logs: `logs/app.log`
- Docker logs: `docker-compose logs interview-helper`
- System logs: `/var/log/syslog` (Linux)
- Web server logs: `/var/log/nginx/` (if using nginx)

**Key log patterns to look for:**
```bash
# Errors
grep -i error logs/app.log

# Performance issues
grep "responseTime.*[0-9]\{4,\}" logs/app.log

# Security events
grep -i "security\|auth\|rate" logs/app.log

# Support request events
grep "Support request" logs/app.log
```

### Debug Mode

Enable detailed logging:
```bash
# Set debug environment
export LOG_LEVEL=debug
export ENABLE_REQUEST_LOGGING=true

# Restart with debug logging
pm2 restart interview-helper
```

### System Information Collection

Gather system info for support:
```bash
#!/bin/bash
echo "=== System Information ===" > debug-info.txt
uname -a >> debug-info.txt
node --version >> debug-info.txt
npm --version >> debug-info.txt
docker --version >> debug-info.txt

echo "=== Application Status ===" >> debug-info.txt
curl -s http://localhost:4000/health/detailed >> debug-info.txt

echo "=== Recent Logs ===" >> debug-info.txt
tail -50 logs/app.log >> debug-info.txt

echo "=== Environment ===" >> debug-info.txt
env | grep -E "(NODE|PORT|LOG)" >> debug-info.txt
```

### Support Channels

When reporting issues, include:
1. Error messages and stack traces
2. System information (OS, Node.js version)
3. Configuration details (anonymized)
4. Steps to reproduce the issue
5. Recent log entries
6. Health check output

Remember to remove sensitive information (passwords, email addresses, etc.) before sharing logs or configuration files.