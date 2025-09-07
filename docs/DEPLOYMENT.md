# Deployment Guide

## Overview

This guide covers deploying the Post-Meeting Social Media Generator to production environments.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 15+ database
- Redis (optional, for caching)
- Domain name and SSL certificate
- API keys for external services

## Environment Setup

### 1. Database Setup

#### Option A: Managed Database (Recommended)

Use a managed PostgreSQL service like:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- Supabase
- Neon

#### Option B: Self-Hosted Database

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE postmeeting;
CREATE USER postmeeting_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE postmeeting TO postmeeting_user;
\q
```

### 2. Redis Setup (Optional)

#### Option A: Managed Redis

Use a managed Redis service like:
- AWS ElastiCache
- Google Cloud Memorystore
- Azure Cache for Redis
- Redis Cloud

#### Option B: Self-Hosted Redis

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 3. API Keys Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

#### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add billing information

#### Recall.ai
1. Go to [Recall.ai](https://recall.ai/)
2. Create an account and get API key

#### LinkedIn API (Optional)
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create a new app
3. Request access to Share on LinkedIn API

#### Facebook API (Optional)
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login and Pages API

## Deployment Methods

### Method 1: Docker Compose (Recommended)

#### 1. Clone Repository

```bash
git clone <repository-url>
cd post-meeting-social-generator
```

#### 2. Environment Configuration

Create `.env.production` file:

```env
# Database
DATABASE_URL="postgresql://username:password@your-db-host:5432/postmeeting"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secure-production-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Recall.ai
RECALL_API_KEY="your-recall-api-key"

# Redis (optional)
REDIS_URL="redis://your-redis-host:6379"

# Environment
NODE_ENV="production"
```

#### 3. Deploy with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma db push

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4. Setup Nginx (Optional)

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Method 2: Vercel (Serverless)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Configure Environment Variables

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add OPENAI_API_KEY
vercel env add RECALL_API_KEY
```

#### 3. Deploy

```bash
vercel --prod
```

### Method 3: AWS (ECS/Fargate)

#### 1. Build Docker Image

```bash
docker build -f Dockerfile.prod -t your-app:latest .
```

#### 2. Push to ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag your-app:latest your-account.dkr.ecr.us-east-1.amazonaws.com/your-app:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/your-app:latest
```

#### 3. Create ECS Task Definition

```json
{
  "family": "post-meeting-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/your-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/post-meeting-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Method 4: Google Cloud Platform

#### 1. Build and Push to GCR

```bash
gcloud builds submit --tag gcr.io/your-project/post-meeting-app .
```

#### 2. Deploy to Cloud Run

```bash
gcloud run deploy post-meeting-app \
  --image gcr.io/your-project/post-meeting-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

## SSL/TLS Configuration

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption
4. Configure security settings

## Monitoring and Logging

### Application Monitoring

#### Prometheus + Grafana

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'post-meeting-app'
    static_configs:
      - targets: ['app:3000']
```

#### Health Checks

```bash
# Check application health
curl -f https://your-domain.com/api/health

# Check database connection
docker-compose exec app npx prisma db push --preview-feature
```

### Log Management

#### Centralized Logging

```yaml
# docker-compose.prod.yml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### Log Aggregation

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Fluentd**: Log collection and forwarding
- **Splunk**: Enterprise log management
- **Datadog**: Application performance monitoring

## Backup and Recovery

### Database Backup

```bash
# Create backup
pg_dump -h your-db-host -U username -d postmeeting > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h your-db-host -U username -d postmeeting < backup_file.sql
```

### Automated Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_$DATE.sql"
aws s3 cp "backup_$DATE.sql" s3://your-backup-bucket/
rm "backup_$DATE.sql"
```

## Security Considerations

### Environment Variables

- Use secrets management services (AWS Secrets Manager, Azure Key Vault)
- Never commit secrets to version control
- Rotate secrets regularly

### Network Security

- Use VPCs and private subnets
- Configure security groups/firewalls
- Enable DDoS protection

### Application Security

- Enable rate limiting
- Use HTTPS everywhere
- Implement proper CORS policies
- Regular security updates

## Performance Optimization

### Caching

```javascript
// Redis caching example
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function getCachedData(key) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchDataFromDatabase();
  await client.setex(key, 3600, JSON.stringify(data));
  return data;
}
```

### Database Optimization

- Add proper indexes
- Use connection pooling
- Monitor slow queries
- Regular maintenance

### CDN Configuration

- Use CloudFlare or AWS CloudFront
- Cache static assets
- Enable compression
- Optimize images

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
docker-compose exec app npx prisma db push

# Check database logs
docker-compose logs db
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Increase memory limits
# In docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

#### SSL Certificate Issues

```bash
# Check certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Renew certificate
sudo certbot renew
```

### Log Analysis

```bash
# View application logs
docker-compose logs -f app

# Search for errors
docker-compose logs app | grep ERROR

# Monitor real-time logs
tail -f logs/combined-$(date +%Y-%m-%d).log
```

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Monitor security advisories
- Review and rotate secrets
- Backup verification
- Performance monitoring
- Log cleanup

### Update Procedure

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Pull latest code
git pull origin main

# 3. Update dependencies
npm ci

# 4. Run migrations
npx prisma db push

# 5. Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Verify deployment
curl -f https://your-domain.com/api/health
```

## Support

For deployment issues:
- Check application logs
- Review health check endpoint
- Monitor system resources
- Contact support team
