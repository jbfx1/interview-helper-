# Interview Helper - Deployment Guide

This guide covers different deployment strategies for the Interview Helper application.

## Quick Start

### Prerequisites
- Node.js 20+ (for direct deployment)
- Docker & Docker Compose (for containerized deployment)
- Git (for source code management)

### Environment Setup
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Update environment variables for your deployment

## Deployment Methods

### Method 1: Docker Deployment (Recommended)

Docker deployment provides isolation, consistency, and easy scaling.

#### Step 1: Prepare Environment
```bash
# Clone repository
git clone https://github.com/yourusername/interview-helper.git
cd interview-helper

# Copy and configure environment
cp .env.example .env
# Edit .env file with production values
```

#### Step 2: Deploy with Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy with Docker (default)
./scripts/deploy.sh docker
```

#### Step 3: Manual Docker Deployment
```bash
# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f interview-helper
```

#### Step 4: Verify Deployment
```bash
# Health check
curl http://localhost:4000/health

# Test support endpoint
curl -X POST http://localhost:4000/support \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","topic":"Test","message":"Test message","urgency":"normal"}'
```

### Method 2: Direct Node.js Deployment

Direct deployment runs the application using Node.js without containers.

#### Step 1: Install Dependencies
```bash
npm install --production
```

#### Step 2: Build Application  
```bash
npm run build
```

#### Step 3: Start Application
```bash
# Direct start
node server/index.js

# Or with PM2 (recommended for production)
npm install -g pm2
pm2 start server/index.js --name interview-helper
pm2 save
pm2 startup
```

#### Step 4: Use Deployment Script
```bash
./scripts/deploy.sh direct
```

## Production Configuration

### Environment Variables

#### Required Variables
```bash
NODE_ENV=production
PORT=4000
SUPPORT_QUEUE_FILE=/app/data/support-queue.json
```

#### Security Configuration
```bash
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
REQUEST_TIMEOUT_MS=30000
MAX_REQUEST_SIZE=10mb
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=50     # Reduced for production
```

#### Logging
```bash
LOG_LEVEL=warn                 # Reduced logging
ENABLE_REQUEST_LOGGING=false   # Disable detailed request logs
```

#### Backup & Data Management
```bash
BACKUP_INTERVAL_HOURS=12       # More frequent backups
DATA_RETENTION_DAYS=730        # 2 years retention
```

### SSL/TLS Configuration

#### Using Nginx (Recommended)
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (add to cron)
0 2 * * * /usr/bin/certbot renew --quiet
```

## Monitoring & Maintenance

### Health Monitoring

#### Automated Health Checks
```bash
# Simple health check script
#!/bin/bash
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "Application healthy"
else
    echo "Application unhealthy - restarting"
    # Restart commands here
fi
```

#### External Monitoring
- Set up monitoring tools (e.g., Uptime Robot, Pingdom)
- Monitor endpoints: `/health`, `/health/ready`
- Set up alerts for downtime

### Backup Strategy

#### Automated Backups
```bash
# Add to crontab for daily backups
0 2 * * * /path/to/interview-helper/scripts/backup.sh backup

# Weekly full backups
0 3 * * 0 /path/to/interview-helper/scripts/backup.sh full
```

#### Manual Backup
```bash
# Create backup
./scripts/backup.sh backup

# List backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore backup-file.tar.gz
```

### Log Management

#### Log Rotation (using logrotate)
```bash
# /etc/logrotate.d/interview-helper
/path/to/interview-helper/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        systemctl restart interview-helper
    endscript
}
```

#### Log Monitoring
```bash
# Monitor application logs
tail -f logs/app.log

# Monitor specific events
grep "ERROR" logs/app.log
grep "Support request" logs/app.log
```

## Scaling & Performance

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
upstream interview_backend {
    server localhost:4000;
    server localhost:4001;
    server localhost:4002;
}

server {
    listen 80;
    location / {
        proxy_pass http://interview_backend;
    }
}
```

#### Docker Swarm Deployment
```yaml
# docker-stack.yml
version: '3.8'
services:
  interview-helper:
    image: interview-helper:latest
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    ports:
      - "4000:4000"
```

### Performance Optimization

#### Node.js Optimization
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048"

# Enable cluster mode
# Use PM2 cluster mode
pm2 start server/index.js -i max --name interview-helper
```

#### Database Optimization
- Consider migrating from JSON files to database for high volume
- Implement database indexing
- Use connection pooling

## Troubleshooting

### Common Issues

#### Application Won't Start
1. Check environment variables
2. Verify file permissions
3. Check port availability
4. Review application logs

#### High Memory Usage
1. Monitor with `htop` or similar
2. Check for memory leaks
3. Adjust Node.js memory limits
4. Consider process restart strategies

#### Rate Limiting Issues
1. Check rate limit configuration
2. Monitor request patterns
3. Adjust limits if needed
4. Consider IP whitelisting

### Debug Commands

#### Check Application Status
```bash
# Docker deployment
docker-compose ps
docker-compose logs interview-helper

# Direct deployment
pm2 status
pm2 logs interview-helper

# System resources
htop
df -h
```

#### Test API Endpoints
```bash
# Health checks
curl -v http://localhost:4000/health
curl -v http://localhost:4000/health/detailed

# Support request test
curl -X POST http://localhost:4000/support \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","topic":"Test Topic","message":"This is a test message","urgency":"normal"}'

# Admin endpoints (with auth)
curl -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:4000/admin/stats
```

### Recovery Procedures

#### Application Recovery
1. Check system resources (CPU, memory, disk)
2. Review recent logs for errors
3. Attempt graceful restart
4. If needed, restore from backup
5. Verify functionality after recovery

#### Data Recovery
1. Stop application
2. Restore from most recent backup
3. Verify data integrity
4. Restart application
5. Monitor for issues

## Security Considerations

### Production Security Checklist

- [ ] Change default admin credentials
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Implement proper backup encryption
- [ ] Use environment variables for secrets
- [ ] Regular penetration testing

### Security Headers
The application automatically sets security headers:
- Content Security Policy
- Strict Transport Security
- X-Frame-Options
- X-Content-Type-Options

### Rate Limiting
Built-in rate limiting protects against:
- Brute force attacks
- API abuse
- DDoS attacks

## Updates & Maintenance

### Application Updates
1. Create backup before update
2. Test updates in staging environment
3. Use blue-green deployment strategy
4. Monitor application after update
5. Have rollback plan ready

### System Maintenance
- Regular OS updates
- Docker image updates
- SSL certificate renewal
- Log cleanup
- Database maintenance (if applicable)

## Support & Monitoring Tools

### Recommended Tools
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerts**: PagerDuty, OpsGenie
- **Backup**: Automated cloud backup solutions
- **Security**: OWASP ZAP for security testing

This deployment guide provides comprehensive instructions for production deployment of the Interview Helper application. Choose the deployment method that best fits your infrastructure and requirements.