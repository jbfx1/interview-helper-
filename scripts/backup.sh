#!/bin/bash

# Interview Helper - Backup Script
# This script creates backups of the application data and configuration

set -e  # Exit on any error

# Configuration
BACKUP_BASE_DIR="./data/backups"
CONFIG_BACKUP_DIR="./config-backups"
LOG_FILE="./logs/backup-$(date +%Y%m%d_%H%M%S).log"
RETENTION_DAYS=30

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

# Create backup directories
create_directories() {
    log "Creating backup directories..."
    mkdir -p "$BACKUP_BASE_DIR" "$CONFIG_BACKUP_DIR" "./logs"
    success "Backup directories created"
}

# Backup application data
backup_data() {
    log "Starting data backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    DATA_BACKUP_FILE="$BACKUP_BASE_DIR/interview-helper-data-$TIMESTAMP.tar.gz"
    
    # Check if data directory exists
    if [ ! -d "data" ]; then
        warning "Data directory not found, creating empty backup"
        mkdir -p data
        touch data/.gitkeep
    fi
    
    # Create compressed backup of data directory
    tar -czf "$DATA_BACKUP_FILE" data/ || error "Failed to create data backup"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$DATA_BACKUP_FILE" | cut -f1)
    
    success "Data backup created: $DATA_BACKUP_FILE ($BACKUP_SIZE)"
    
    # Count files in backup
    if [ -f "data/support-queue.json" ]; then
        SUPPORT_REQUESTS=$(jq length data/support-queue.json 2>/dev/null || echo "unknown")
        log "Support requests backed up: $SUPPORT_REQUESTS"
    fi
}

# Backup configuration files
backup_config() {
    log "Starting configuration backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CONFIG_BACKUP_FILE="$CONFIG_BACKUP_DIR/interview-helper-config-$TIMESTAMP.tar.gz"
    
    # List of configuration files to backup
    CONFIG_FILES=()
    
    # Check and add existing config files
    [ -f ".env" ] && CONFIG_FILES+=(".env")
    [ -f ".env.example" ] && CONFIG_FILES+=(".env.example")
    [ -f "package.json" ] && CONFIG_FILES+=("package.json")
    [ -f "package-lock.json" ] && CONFIG_FILES+=("package-lock.json")
    [ -f "tsconfig.json" ] && CONFIG_FILES+=("tsconfig.json")
    [ -f "vite.config.ts" ] && CONFIG_FILES+=("vite.config.ts")
    [ -f "docker-compose.yml" ] && CONFIG_FILES+=("docker-compose.yml")
    [ -f "Dockerfile" ] && CONFIG_FILES+=("Dockerfile")
    [ -f "nginx.conf" ] && CONFIG_FILES+=("nginx.conf")
    
    if [ ${#CONFIG_FILES[@]} -eq 0 ]; then
        warning "No configuration files found to backup"
        return
    fi
    
    # Create configuration backup
    tar -czf "$CONFIG_BACKUP_FILE" "${CONFIG_FILES[@]}" || error "Failed to create config backup"
    
    # Get backup size
    CONFIG_BACKUP_SIZE=$(du -h "$CONFIG_BACKUP_FILE" | cut -f1)
    
    success "Configuration backup created: $CONFIG_BACKUP_FILE ($CONFIG_BACKUP_SIZE)"
    log "Backed up files: ${CONFIG_FILES[*]}"
}

# Backup logs
backup_logs() {
    log "Starting logs backup..."
    
    if [ ! -d "logs" ] || [ -z "$(ls -A logs 2>/dev/null)" ]; then
        warning "No logs directory or logs found to backup"
        return
    fi
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    LOGS_BACKUP_FILE="$BACKUP_BASE_DIR/interview-helper-logs-$TIMESTAMP.tar.gz"
    
    # Create logs backup
    tar -czf "$LOGS_BACKUP_FILE" logs/ || error "Failed to create logs backup"
    
    # Get backup size
    LOGS_BACKUP_SIZE=$(du -h "$LOGS_BACKUP_FILE" | cut -f1)
    
    success "Logs backup created: $LOGS_BACKUP_FILE ($LOGS_BACKUP_SIZE)"
}

# Create full system backup
create_full_backup() {
    log "Creating full system backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FULL_BACKUP_FILE="$BACKUP_BASE_DIR/interview-helper-full-$TIMESTAMP.tar.gz"
    
    # Exclude node_modules and other large directories
    tar -czf "$FULL_BACKUP_FILE" \
        --exclude="node_modules" \
        --exclude="dist" \
        --exclude=".git" \
        --exclude="logs" \
        --exclude="data/backups" \
        --exclude="data/exports" \
        . || error "Failed to create full backup"
    
    # Get backup size
    FULL_BACKUP_SIZE=$(du -h "$FULL_BACKUP_FILE" | cut -f1)
    
    success "Full backup created: $FULL_BACKUP_FILE ($FULL_BACKUP_SIZE)"
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
    
    CLEANUP_COUNT=0
    
    # Clean up data backups
    if [ -d "$BACKUP_BASE_DIR" ]; then
        CLEANUP_COUNT=$(find "$BACKUP_BASE_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS | wc -l)
        find "$BACKUP_BASE_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    fi
    
    # Clean up config backups
    if [ -d "$CONFIG_BACKUP_DIR" ]; then
        CLEANUP_COUNT=$((CLEANUP_COUNT + $(find "$CONFIG_BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS | wc -l)))
        find "$CONFIG_BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    fi
    
    if [ "$CLEANUP_COUNT" -gt 0 ]; then
        success "Cleaned up $CLEANUP_COUNT old backup files"
    else
        log "No old backups to clean up"
    fi
}

# List existing backups
list_backups() {
    log "Listing existing backups..."
    
    echo -e "\n${BLUE}Data Backups:${NC}"
    if [ -d "$BACKUP_BASE_DIR" ]; then
        find "$BACKUP_BASE_DIR" -name "interview-helper-data-*.tar.gz" -printf "%T+ %s %p\n" | sort -r | head -10 | while read -r line; do
            SIZE=$(echo "$line" | awk '{print $2}' | numfmt --to=iec)
            FILE=$(echo "$line" | awk '{print $3}')
            DATE=$(echo "$line" | awk '{print $1}' | cut -d+ -f1)
            echo "  $DATE - $(basename "$FILE") ($SIZE)"
        done
    else
        echo "  No data backups found"
    fi
    
    echo -e "\n${BLUE}Configuration Backups:${NC}"
    if [ -d "$CONFIG_BACKUP_DIR" ]; then
        find "$CONFIG_BACKUP_DIR" -name "interview-helper-config-*.tar.gz" -printf "%T+ %s %p\n" | sort -r | head -5 | while read -r line; do
            SIZE=$(echo "$line" | awk '{print $2}' | numfmt --to=iec)
            FILE=$(echo "$line" | awk '{print $3}')
            DATE=$(echo "$line" | awk '{print $1}' | cut -d+ -f1)
            echo "  $DATE - $(basename "$FILE") ($SIZE)"
        done
    else
        echo "  No configuration backups found"
    fi
}

# Restore from backup
restore_backup() {
    local BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
        error "Backup file not found: $BACKUP_FILE"
    fi
    
    log "Restoring from backup: $BACKUP_FILE"
    
    # Create backup of current data before restoring
    warning "Creating backup of current data before restore..."
    backup_data
    
    # Extract backup
    tar -xzf "$BACKUP_FILE" || error "Failed to extract backup"
    
    success "Backup restored successfully"
    warning "Please restart the application to apply changes"
}

# Main backup function
main() {
    local ACTION="${1:-backup}"
    
    case "$ACTION" in
        backup)
            log "Starting Interview Helper backup process..."
            create_directories
            backup_data
            backup_config
            backup_logs
            cleanup_old_backups
            success "Backup process completed successfully!"
            ;;
        full)
            log "Starting full Interview Helper backup..."
            create_directories
            create_full_backup
            cleanup_old_backups
            success "Full backup completed successfully!"
            ;;
        list)
            list_backups
            ;;
        restore)
            if [ -z "$2" ]; then
                error "Please specify backup file to restore: $0 restore <backup-file>"
            fi
            restore_backup "$2"
            ;;
        *)
            echo "Usage: $0 {backup|full|list|restore <file>}"
            echo "  backup  - Backup data, config, and logs (default)"
            echo "  full    - Create full application backup"
            echo "  list    - List existing backups"
            echo "  restore - Restore from specified backup file"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"