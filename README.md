# Interview Helper - Production-Ready Support Portal

> A comprehensive, enterprise-ready React + Express application for managing interview preparation support requests with advanced features for production deployment.

## 🚀 Features

### Core Functionality
- **Support Request Management**: Comprehensive form submission with validation
- **Real-time Processing**: Immediate request processing and queue management
- **Data Persistence**: Robust JSON-based storage with backup capabilities

### Production Features
- **Advanced Security**: Rate limiting, input sanitization, security headers, CSRF protection
- **Comprehensive Logging**: Structured logging with request tracking and error analysis
- **Health Monitoring**: Multiple health check endpoints with detailed system diagnostics  
- **Admin Dashboard**: Full administrative interface with authentication
- **Backup & Recovery**: Automated backups with restore capabilities
- **Data Export**: CSV/JSON export with filtering and analytics
- **Docker Support**: Complete containerization with multi-stage builds
- **Performance Optimization**: Request timeout handling, compression, caching headers

### Enterprise Features
- **Rate Limiting**: Multi-tier rate limiting (general, support requests, admin operations)
- **Data Retention**: Configurable data retention policies
- **Monitoring & Metrics**: Application performance metrics and system resource monitoring
- **Graceful Shutdown**: Proper cleanup and shutdown handling
- **Process Management**: Support for PM2, Docker, and container orchestration

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Admin Panel](#-admin-panel)
- [Monitoring](#-monitoring)
- [Backup & Recovery](#-backup--recovery)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/interview-helper.git
cd interview-helper

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev:server

# In another terminal, start frontend
npm run dev
```

### Production Deployment (Docker)
```bash
# Quick production deployment
./scripts/deploy.sh docker

# Or manual deployment
docker-compose up -d --build

# Verify deployment
curl http://localhost:4000/health
```

## 📦 Installation

### Prerequisites
- **Node.js**: Version 20 or higher
- **Docker**: For containerized deployment (recommended)
- **Git**: For source code management

### Local Development
```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run lint

# Build application
npm run build
```

### Production Installation
```bash
# Install production dependencies only
npm install --production

# Build for production
npm run build

# Start production server
npm start
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| **Server Configuration** |
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `4000` | Server port |
| **Security** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `REQUEST_TIMEOUT_MS` | `30000` | Request timeout |
| `MAX_REQUEST_SIZE` | `10mb` | Maximum request body size |
| **Data Management** |
| `SUPPORT_QUEUE_FILE` | `data/support-queue.json` | Queue file path |
| `BACKUP_INTERVAL_HOURS` | `24` | Automatic backup interval |
| `DATA_RETENTION_DAYS` | `365` | Data retention period |
| **Logging** |
| `LOG_LEVEL` | `info` | Logging level |
| `ENABLE_REQUEST_LOGGING` | `true` | Request logging toggle |

### Production Configuration
```bash
# Copy and customize for production
cp .env.example .env

# Key production settings
NODE_ENV=production
LOG_LEVEL=warn
CORS_ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=50
ENABLE_REQUEST_LOGGING=false
```

## 🚢 Deployment

### Docker Deployment (Recommended)

#### Quick Deployment
```bash
# Use deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh docker
```

#### Manual Docker Deployment
```bash
# Build and start
docker-compose up -d --build

# View status
docker-compose ps

# Check logs
docker-compose logs -f interview-helper

# Stop services
docker-compose down
```

#### Production Docker Configuration
```yaml
# docker-compose.yml includes:
# - Multi-stage builds
# - Health checks
# - Volume persistence
# - Nginx reverse proxy
# - Auto-restart policies
```

### Direct Node.js Deployment

#### With PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server/index.js --name interview-helper

# Setup auto-startup
pm2 startup
pm2 save
```

#### Direct Deployment
```bash
# Build application
npm run build

# Start server
node server/index.js
```

#### Using Deployment Script
```bash
./scripts/deploy.sh direct
```

## 📖 API Documentation

### Endpoints Overview

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/health` | GET | Basic health check | 60/min |
| `/health/detailed` | GET | Comprehensive health info | 60/min |
| `/support` | POST | Submit support request | 5/15min |
| `/admin/*` | Various | Admin operations | 20/5min |

### Support Request Submission
```bash
curl -X POST http://localhost:4000/support \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "topic": "System Design Interview",
    "message": "Need help with system design concepts",
    "urgency": "normal"
  }'
```

### Health Monitoring
```bash
# Basic health check
curl http://localhost:4000/health

# Detailed system info
curl http://localhost:4000/health/detailed

# Application metrics
curl http://localhost:4000/health/metrics
```

**📚 [Complete API Documentation](docs/API.md)**

## 🛡️ Admin Panel

### Access
- **URL**: `http://localhost:4000/admin/*`
- **Authentication**: Basic Auth (change defaults in production)
- **Default Credentials**: `admin:admin123`

### Features
- **Request Management**: View, filter, and search support requests
- **Statistics**: Request analytics and system metrics
- **Backup Management**: Create, list, and restore backups
- **Data Export**: Export requests in CSV/JSON format
- **System Health**: Detailed application and system status

### Admin API Examples
```bash
# Get support request statistics
curl -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:4000/admin/stats

# Create backup
curl -X POST \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  http://localhost:4000/admin/backup

# Export data as CSV
curl -X POST \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM=" \
  -H "Content-Type: application/json" \
  -d '{"format": "csv", "urgency": "urgent"}' \
  http://localhost:4000/admin/export
```

## 📊 Monitoring

### Health Checks
- **Basic**: `/health` - Simple up/down status
- **Detailed**: `/health/detailed` - Comprehensive system check
- **Ready**: `/health/ready` - Container readiness probe
- **Live**: `/health/live` - Container liveness probe
- **Metrics**: `/health/metrics` - Application metrics

### Key Metrics
- Request volume and response times
- Memory usage and heap statistics
- Data integrity and queue status
- Error rates and security events

### Logging
- **Structured Logging**: JSON format in production
- **Request Tracking**: Unique request IDs
- **Error Tracking**: Detailed error analysis
- **Security Events**: Authentication and rate limiting events

## 💾 Backup & Recovery

### Automated Backups
```bash
# Automatic backups run every 24 hours (configurable)
# Backups include: data files, metadata, integrity checks
```

### Manual Backup Operations
```bash
# Create backup
./scripts/backup.sh backup

# Create full system backup
./scripts/backup.sh full

# List available backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore <backup-file>
```

### Backup Features
- **Incremental Backups**: Daily data snapshots
- **Metadata Tracking**: Backup timestamp, size, record count
- **Compression**: Gzipped archives for space efficiency  
- **Retention Policy**: Configurable cleanup of old backups
- **Integrity Validation**: Backup verification before restore

## 🔧 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check port availability
netstat -tulpn | grep :4000

# Verify environment configuration
cat .env

# Check application logs
tail -f logs/app.log
```

#### Database/Queue Issues
```bash
# Validate queue file format
cat data/support-queue.json | jq .

# Check file permissions
ls -la data/

# Create fresh queue if corrupted
echo '[]' > data/support-queue.json
```

#### Performance Issues
```bash
# Monitor system resources
htop

# Check response times
time curl http://localhost:4000/health

# Analyze slow requests
grep "responseTime.*[0-9]\{4,\}" logs/app.log
```

**📚 [Complete Troubleshooting Guide](docs/TROUBLESHOOTING.md)**

## 📈 Performance & Scaling

### Performance Features
- **Request Timeout Handling**: Configurable timeouts
- **Compression**: Gzip compression for responses
- **Caching Headers**: Optimal caching for static assets
- **Memory Management**: Configurable Node.js memory limits

### Scaling Options
- **Horizontal Scaling**: Multiple instances with load balancer
- **Container Scaling**: Docker Swarm or Kubernetes support
- **Database Migration**: Easy migration to PostgreSQL/MySQL for high volume

## 🔒 Security

### Security Features
- **Rate Limiting**: Multi-tier protection against abuse
- **Input Sanitization**: XSS and injection protection
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **CSRF Protection**: Origin validation and token support
- **Authentication**: Admin panel protection

### Production Security
- **HTTPS/SSL**: Full encryption support
- **Firewall Configuration**: Port and IP restrictions
- **Regular Updates**: Automated dependency updates
- **Security Monitoring**: Attack detection and logging

## 🧪 Testing

### Test Suite
```bash
# Unit tests
npm test

# End-to-end tests  
npm run test:e2e

# Type checking
npm run lint

# All tests
npm run test && npm run test:e2e && npm run lint
```

### Test Coverage
- **Unit Tests**: Components, services, API routes
- **Integration Tests**: Full request/response cycles
- **End-to-End Tests**: Complete user workflows
- **Type Safety**: Full TypeScript coverage

## 📚 Documentation

### Available Documentation
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Production deployment instructions  
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**: Issue diagnosis and resolution

### Architecture
- **Frontend**: React with TypeScript, form validation
- **Backend**: Express.js with comprehensive middleware
- **Storage**: JSON-based with backup/export capabilities
- **Security**: Multi-layer protection and monitoring

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run test suite
5. Submit pull request

### Code Standards
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear API and feature documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Issues**: GitHub Issues for bug reports
- **Documentation**: Comprehensive guides in `/docs`
- **Troubleshooting**: Step-by-step problem resolution

### Enterprise Support
For enterprise deployments, custom integrations, or professional support, please contact the development team.

---

**Interview Helper** - Empowering interview preparation through robust, production-ready support management. ✨
