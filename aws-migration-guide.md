# AWS Aurora Serverless v2 Migration Guide for Calonik.ai

## Overview
This guide helps you migrate from Replit's PostgreSQL database to AWS Aurora Serverless v2 PostgreSQL for better scalability and cost efficiency.

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Current database access for data export

## Step 1: Create AWS Aurora Serverless v2 Cluster

### Using AWS Console:
1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "Amazon Aurora"
4. Select "Aurora PostgreSQL-Compatible"
5. Choose "Serverless v2" capacity type
6. Configure:
   - **Cluster identifier:** `calonik-production`
   - **Master username:** `calonik_admin`
   - **Master password:** (generate secure password)
   - **Database name:** `calonik_db`
   - **VPC:** Default VPC (or create new)
   - **Subnet group:** Default
   - **Security groups:** Create new allowing PostgreSQL (port 5432)

### Serverless v2 Scaling:
- **Minimum capacity:** 0.5 ACU (Aurora Capacity Units)
- **Maximum capacity:** 2 ACU (can scale up later)
- **Auto-pause:** Enable after 5 minutes of inactivity

## Step 2: Configure Security Groups

Create security group rules:
```
Type: PostgreSQL
Port: 5432
Source: Your IP address (for migration)
Source: 0.0.0.0/0 (for production - restrict later)
```

## Step 3: Database Migration Process

### Export Current Data:
```bash
# From Replit shell or local machine with access
pg_dump $DATABASE_URL > calonik_backup.sql
```

### Import to Aurora:
```bash
# Connect to new Aurora cluster
psql -h your-aurora-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com \
     -U calonik_admin \
     -d calonik_db \
     -f calonik_backup.sql
```

## Step 4: Update Application Configuration

The connection string format will be:
```
postgresql://calonik_admin:password@your-aurora-endpoint.cluster-xxxxx.us-east-1.rds.amazonaws.com:5432/calonik_db
```

## Step 5: Environment Variables

Add to Replit Secrets:
- `AWS_DATABASE_URL`: Your Aurora connection string
- Keep existing `DATABASE_URL` for rollback if needed

## Step 6: Test Migration

1. Update code to use AWS_DATABASE_URL
2. Run database migrations: `npm run db:push`
3. Test all functionality
4. Monitor performance and costs

## Cost Optimization

Aurora Serverless v2 pricing:
- **Compute:** $0.12 per ACU-hour
- **Storage:** $0.10 per GB-month
- **I/O:** $0.20 per million requests

Estimated monthly cost for Calonik.ai: $15-40

## Rollback Plan

If issues occur:
1. Switch back to `DATABASE_URL`
2. Re-deploy application
3. Aurora cluster can be paused to avoid charges

## Production Checklist

- [ ] Aurora cluster created
- [ ] Security groups configured
- [ ] Data migrated and verified
- [ ] Application updated and tested
- [ ] DNS and domain configured
- [ ] Monitoring enabled
- [ ] Backup schedule confirmed

## Next Steps After Migration

1. Set up CloudWatch monitoring
2. Configure automated backups
3. Implement connection pooling if needed
4. Consider read replicas for scaling
5. Set up AWS RDS Proxy for connection management