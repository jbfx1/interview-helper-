#!/bin/bash

# Interview Helper - Production Deployment Script
# This script automates the deployment process for the Interview Helper application

set -e  # Exit on any error

# Configuration
PROJECT_NAME="interview-helper"
DOCKER_IMAGE_NAME="interview-helper"
BACKUP_DIR="./backups/pre-deploy"
LOG_FILE="./logs/deploy-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p logs data/backups data/exports "$BACKUP_DIR"
    success "Directories created"
}

# Backup current data before deployment
backup_data() {
    log "Creating backup before deployment..."
    
    if [ -f "data/support-queue.json" ]; then
        BACKUP_FILE="$BACKUP_DIR/support-queue-$(date +%Y%m%d_%H%M%S).json"
        cp "data/support-queue.json" "$BACKUP_FILE"
        success "Data backed up to $BACKUP_FILE"
    else
        warning "No existing data file found to backup"
    fi
}

# Validate environment configuration
validate_environment() {
    log "Validating environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            warning "No .env file found. Creating from .env.example..."
            cp .env.example .env
            warning "Please review and update .env file with production values"
        else
            error ".env file not found and no .env.example available"
        fi
    fi
    
    # Check required environment variables
    source .env
    
    if [ -z "$NODE_ENV" ]; then
        error "NODE_ENV is not set in .env file"
    fi
    
    if [ -z "$PORT" ]; then
        error "PORT is not set in .env file"
    fi
    
    success "Environment configuration validated"
}

# Run tests
run_tests() {
    log "Running test suite..."
    
    if command -v npm >/dev/null 2>&1; then
        npm test || error "Tests failed"
        npm run lint || error "Linting failed"
        success "All tests passed"
    else
        warning "npm not found, skipping tests"
    fi
}

# Build Docker image
build_docker_image() {
    log "Building Docker image..."
    
    docker build -t "$DOCKER_IMAGE_NAME:latest" . || error "Docker build failed"
    
    # Tag with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    docker tag "$DOCKER_IMAGE_NAME:latest" "$DOCKER_IMAGE_NAME:$TIMESTAMP"
    
    success "Docker image built: $DOCKER_IMAGE_NAME:latest"
}

# Deploy with Docker Compose
deploy_with_compose() {
    log "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down || warning "No existing containers to stop"
    
    # Pull latest changes and deploy
    docker-compose up -d --build || error "Docker Compose deployment failed"
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:4000/health >/dev/null 2>&1; then
        success "Application is running and healthy"
    else
        error "Health check failed"
    fi
}

# Deploy without Docker (direct Node.js)
deploy_direct() {
    log "Deploying directly with Node.js..."
    
    # Install dependencies
    npm install --production || error "Failed to install dependencies"
    
    # Build application
    npm run build || error "Build failed"
    
    # Stop existing process (if using PM2 or similar)
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop "$PROJECT_NAME" || warning "No existing PM2 process to stop"
        pm2 start server/index.js --name "$PROJECT_NAME" || error "Failed to start with PM2"
        success "Application started with PM2"
    else
        warning "PM2 not found. Starting directly..."
        node server/index.js &
        success "Application started directly"
    fi
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait a moment for services to fully start
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:4000/health >/dev/null 2>&1; then
        success "Health check passed"
    else
        error "Health check failed - deployment may have issues"
    fi
    
    # Test main endpoint
    if curl -f http://localhost:4000/support -X POST -H "Content-Type: application/json" -d '{"test": true}' >/dev/null 2>&1; then
        warning "Support endpoint test returned response (expected for invalid data)"
    else
        log "Support endpoint responding"
    fi
    
    success "Deployment verification completed"
}

# Cleanup old Docker images
cleanup_docker() {
    log "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f || warning "Failed to clean up Docker images"
    
    success "Docker cleanup completed"
}

# Main deployment flow
main() {
    log "Starting deployment of Interview Helper..."
    log "Deployment method: ${1:-docker}"
    
    create_directories
    backup_data
    validate_environment
    run_tests
    
    if [ "$1" = "direct" ]; then
        deploy_direct
    else
        build_docker_image
        deploy_with_compose
        cleanup_docker
    fi
    
    verify_deployment
    
    success "Deployment completed successfully!"
    log "Application is running at: http://localhost:4000"
    log "Health check: http://localhost:4000/health"
    log "Admin panel: http://localhost:4000/admin"
    log "Deployment log: $LOG_FILE"
}

# Parse command line arguments
case "$1" in
    docker)
        main docker
        ;;
    direct)
        main direct
        ;;
    *)
        log "Usage: $0 {docker|direct}"
        log "  docker: Deploy using Docker Compose (recommended)"
        log "  direct: Deploy directly with Node.js"
        main docker  # Default to Docker
        ;;
esac