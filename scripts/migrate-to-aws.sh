#!/bin/bash

# AWS Aurora Migration Script for Calonik.ai
# This script helps migrate data from Replit PostgreSQL to AWS Aurora Serverless v2

set -e

echo "🚀 Starting Calonik.ai AWS Aurora Migration"

# Configuration
BACKUP_FILE="calonik_backup_$(date +%Y%m%d_%H%M%S).sql"
REPLIT_DB_URL="${DATABASE_URL}"
AWS_DB_URL="${AWS_DATABASE_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not set"
        exit 1
    fi
    
    if [ -z "$AWS_DATABASE_URL" ]; then
        print_error "AWS_DATABASE_URL not set"
        exit 1
    fi
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        print_error "psql not found. Please install PostgreSQL client tools."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Export data from Replit database
export_data() {
    echo "Exporting data from Replit database..."
    
    print_warning "Creating backup: $BACKUP_FILE"
    
    pg_dump "$REPLIT_DB_URL" \
        --verbose \
        --clean \
        --no-owner \
        --no-privileges \
        --format=plain \
        --file="$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Data export completed successfully"
        echo "Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    else
        print_error "Data export failed"
        exit 1
    fi
}

# Test AWS connection
test_aws_connection() {
    echo "Testing AWS Aurora connection..."
    
    psql "$AWS_DB_URL" -c "SELECT version();" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_status "AWS Aurora connection successful"
    else
        print_error "Cannot connect to AWS Aurora. Please check your connection string and security groups."
        exit 1
    fi
}

# Import data to AWS Aurora
import_data() {
    echo "Importing data to AWS Aurora..."
    
    print_warning "Starting data import. This may take several minutes..."
    
    psql "$AWS_DB_URL" \
        --quiet \
        --file="$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_status "Data import completed successfully"
    else
        print_error "Data import failed"
        exit 1
    fi
}

# Verify migration
verify_migration() {
    echo "Verifying migration..."
    
    # Count tables in both databases
    REPLIT_TABLES=$(psql "$REPLIT_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    AWS_TABLES=$(psql "$AWS_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    echo "Tables in Replit DB: $REPLIT_TABLES"
    echo "Tables in AWS DB: $AWS_TABLES"
    
    if [ "$REPLIT_TABLES" -eq "$AWS_TABLES" ]; then
        print_status "Table count matches"
    else
        print_warning "Table count mismatch - please verify manually"
    fi
    
    # Check user count
    REPLIT_USERS=$(psql "$REPLIT_DB_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    AWS_USERS=$(psql "$AWS_DB_URL" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    
    echo "Users in Replit DB: $REPLIT_USERS"
    echo "Users in AWS DB: $AWS_USERS"
    
    if [ "$REPLIT_USERS" -eq "$AWS_USERS" ]; then
        print_status "User count matches"
    else
        print_warning "User count mismatch - please verify manually"
    fi
}

# Cleanup
cleanup() {
    echo "Cleaning up..."
    
    read -p "Delete backup file $BACKUP_FILE? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$BACKUP_FILE"
        print_status "Backup file deleted"
    else
        print_status "Backup file kept: $BACKUP_FILE"
    fi
}

# Main migration process
main() {
    echo "=================================="
    echo "Calonik.ai AWS Aurora Migration"
    echo "=================================="
    
    check_prerequisites
    echo ""
    
    export_data
    echo ""
    
    test_aws_connection
    echo ""
    
    import_data
    echo ""
    
    verify_migration
    echo ""
    
    cleanup
    echo ""
    
    print_status "Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update your application to use AWS_DATABASE_URL"
    echo "2. Run database migrations: npm run db:push"
    echo "3. Test all application functionality"
    echo "4. Monitor AWS costs and performance"
    echo ""
    echo "Rollback: If issues occur, switch back to DATABASE_URL"
}

# Run main function
main "$@"