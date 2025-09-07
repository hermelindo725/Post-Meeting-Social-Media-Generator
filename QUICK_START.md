# 🚀 Quick Start Guide - Enterprise Post-Meeting Social Media Generator

## Prerequisites

Before running this project, ensure you have the following installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

### Optional (for full enterprise features)
- **Docker** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Redis** - [Download here](https://redis.io/download) or use Redis Cloud
- **Kubernetes** (for production deployment)

## 🏃‍♂️ Quick Start (5 minutes)

### 1. Clone and Install
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd post-meeting-social-generator

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env.local

# Edit .env.local with your values (see Environment Variables section below)
```

### 3. Database Setup
```bash
# Start PostgreSQL (if not running)
# On Windows: Start PostgreSQL service
# On Mac: brew services start postgresql
# On Linux: sudo systemctl start postgresql

# Create database
createdb postmeeting

# Run database migrations
npx prisma generate
npx prisma db push
```

### 4. Run the Application
```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 🔧 Environment Variables Setup

Create a `.env.local` file with the following variables:

### Required Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/postmeeting"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Google OAuth (Required for calendar integration)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (Required for AI content generation)
OPENAI_API_KEY="your-openai-api-key"

# Recall.ai (Required for meeting recording)
RECALL_API_KEY="your-recall-api-key"
```

### Optional Variables (for full features)
```env
# LinkedIn OAuth (for LinkedIn posting)
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"

# Facebook OAuth (for Facebook posting)
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# Redis (for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# Encryption (for data protection)
MASTER_ENCRYPTION_KEY="your-master-encryption-key"
```

## 🔑 Getting API Keys

### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add `webshookeng@gmail.com` as a test user

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get API key
3. Add billing information (required for API usage)

### 3. Recall.ai API Key
1. Sign up at [Recall.ai](https://recall.ai/)
2. Get your API key from the dashboard
3. Note: This will be provided in the challenge email

### 4. LinkedIn OAuth (Optional)
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create a new app
3. Add OAuth redirect URI: `http://localhost:3000/api/social/callback/linkedin`

### 5. Facebook OAuth (Optional)
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Add OAuth redirect URI: `http://localhost:3000/api/social/callback/facebook`

## 🗄️ Database Setup Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb postmeeting

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/postmeeting"
```

### Option 2: Cloud Database (Recommended)
```bash
# Use Neon (Free tier available)
# 1. Go to https://neon.tech
# 2. Create account and project
# 3. Copy connection string
# 4. Update DATABASE_URL in .env.local

# Or use Supabase
# 1. Go to https://supabase.com
# 2. Create project
# 3. Get connection string from Settings > Database
# 4. Update DATABASE_URL in .env.local
```

### Option 3: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name postgres-postmeeting \
  -e POSTGRES_DB=postmeeting \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Update DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/postmeeting"
```

## 🚀 Running the Application

### Development Mode
```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

### With Docker
```bash
# Build Docker image
docker build -t postmeeting .

# Run with Docker Compose
docker-compose up -d
```

## 🧪 Testing the Setup

### 1. Test Database Connection
```bash
# Run the test setup script
npm run test-setup
```

### 2. Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication (should return 401)
curl http://localhost:3000/api/meetings/past
```

### 3. Test Application Flow
1. Open http://localhost:3000
2. Sign in with Google
3. Check if calendar events load
4. Try creating an automation
5. Test content generation

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check if PostgreSQL is running
# Windows: Check Services
# Mac: brew services list | grep postgresql
# Linux: sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d postmeeting
```

#### 2. OAuth Errors
- Ensure redirect URIs match exactly
- Check if OAuth apps are in development mode
- Verify client IDs and secrets are correct

#### 3. OpenAI API Errors
- Check if API key is valid
- Ensure billing is set up
- Check rate limits

#### 4. Port Already in Use
```bash
# Kill process on port 3000
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Getting Help
1. Check the logs in the terminal
2. Look at browser console for errors
3. Check the README.md for detailed documentation
4. Review the DEPLOYMENT.md for production setup

## 📱 Using the Application

### 1. First Time Setup
1. Sign in with Google
2. Connect your calendar
3. Set up social media accounts (LinkedIn/Facebook)
4. Create content generation automations
5. Configure bot settings

### 2. Daily Usage
1. View upcoming meetings
2. Enable/disable notetakers for meetings
3. Review past meetings and transcripts
4. Generate and post social media content
5. Monitor analytics and performance

### 3. Advanced Features
1. Set up enterprise integrations (Slack, Teams)
2. Configure A/B testing for content
3. Set up monitoring and alerting
4. Use advanced analytics dashboard

## 🚀 Next Steps

### For Development
1. Explore the codebase structure
2. Read the API documentation
3. Set up your IDE with proper extensions
4. Configure debugging

### For Production
1. Follow the DEPLOYMENT.md guide
2. Set up monitoring and alerting
3. Configure backup strategies
4. Set up CI/CD pipeline

### For Enterprise
1. Review ENTERPRISE_FEATURES.md
2. Set up enterprise integrations
3. Configure compliance and security
4. Set up disaster recovery

## 📚 Additional Resources

- **README.md** - Complete project documentation
- **DEPLOYMENT.md** - Production deployment guide
- **ENTERPRISE_FEATURES.md** - Enterprise features overview
- **docs/api-spec.yaml** - Complete API documentation
- **__tests__/** - Test examples and patterns

---

**🎉 You're ready to go! The application should now be running at http://localhost:3000**
