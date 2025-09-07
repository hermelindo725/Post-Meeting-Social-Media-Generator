# 🚀 Post-Meeting Social Media Generator

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5.7.1-2D3748?style=for-the-badge&logo=prisma)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai)

**Enterprise-Grade AI-Powered Meeting-to-Social Media Automation Platform**

[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=flat-square)](__tests__)
[![Coverage](https://img.shields.io/badge/Coverage-80%25-brightgreen?style=flat-square)](__tests__)
[![Security](https://img.shields.io/badge/Security-Hardened-green?style=flat-square)](#security-features)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success?style=flat-square)](#deployment)

</div>

---

## 🎯 **What This Project Delivers**

Transform your meetings into engaging social media content automatically. This enterprise-grade application demonstrates **professional software engineering practices** with a complete, production-ready solution that:

- **🤖 AI-Powered**: Automatically generates social media posts from meeting transcripts
- **🔗 Integrated**: Seamlessly connects Google Calendar, OpenAI, and social platforms
- **🛡️ Secure**: Enterprise-grade security with comprehensive protection
- **📊 Monitored**: Full observability with logging, metrics, and alerting
- **🧪 Tested**: Comprehensive test suite with 80%+ coverage
- **🚀 Scalable**: Production-ready architecture for enterprise deployment

---

## ✨ **Key Features**

### 🎯 **Core Functionality**
- **📅 Meeting Integration**: Automatic Google Calendar sync and meeting detection
- **🎙️ AI Transcription**: Recall.ai integration for meeting recording and transcription
- **🧠 Smart Content Generation**: OpenAI GPT-powered social media post creation
- **📱 Multi-Platform Posting**: LinkedIn, Facebook, and extensible social platform support
- **⚙️ Automation Rules**: Custom automation workflows for different meeting types

### 🏢 **Enterprise Features**
- **🔒 Advanced Security**: Rate limiting, CSRF protection, input validation, SQL injection prevention
- **📊 Comprehensive Monitoring**: Structured logging, performance metrics, health checks
- **🛠️ Error Handling**: Custom error classes with graceful degradation
- **⚡ Performance Optimization**: Database optimization, caching, query performance monitoring
- **🔍 API Validation**: Zod-based type-safe validation for all endpoints
- **📈 Analytics**: Business intelligence and productivity metrics

---

## 🛠️ **Technology Stack**

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>Next.js 14, React 18, TypeScript, Tailwind CSS</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Next.js API Routes, Prisma ORM, PostgreSQL</td>
</tr>
<tr>
<td><strong>Authentication</strong></td>
<td>NextAuth.js with Google OAuth 2.0</td>
</tr>
<tr>
<td><strong>AI Services</strong></td>
<td>OpenAI GPT-3.5/4, Recall.ai</td>
</tr>
<tr>
<td><strong>Social Media</strong></td>
<td>LinkedIn API, Facebook Graph API</td>
</tr>
<tr>
<td><strong>Monitoring</strong></td>
<td>Winston logging, Prometheus metrics, Health checks</td>
</tr>
<tr>
<td><strong>Security</strong></td>
<td>Rate limiting, CSRF protection, Input validation</td>
</tr>
<tr>
<td><strong>Testing</strong></td>
<td>Jest, Testing Library, Supertest, 80%+ coverage</td>
</tr>
<tr>
<td><strong>DevOps</strong></td>
<td>Docker, GitHub Actions, CI/CD pipeline</td>
</tr>
</table>

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL 15+
- Google Cloud Console account
- OpenAI API account
- Recall.ai account

### **1. Installation**

```bash
# Clone the repository
git clone https://github.com/hermelindo725/Post-Meeting-Social-Media-Generator.git
cd post-meeting-social-generator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### **2. Database Setup**

```bash
# Create PostgreSQL database
createdb postmeeting

# Run database migrations
npm run db:push
```

### **3. Environment Configuration**

Update `.env.local` with your credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/postmeeting"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
RECALL_API_KEY="your-recall-api-key"

# Optional: Social Media
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

### **4. Run the Application**

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to access the application.

---

## 🔧 **API Setup Guide**

### **Google OAuth Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

### **OpenAI Setup**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add billing information

### **Recall.ai Setup**
1. Go to [Recall.ai](https://recall.ai/)
2. Create an account and get API key

### **LinkedIn API Setup (Optional)**
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create a new app
3. Request access to Share on LinkedIn API

---

## 🏗️ **Project Architecture**

```
📁 post-meeting-social-generator/
├── 🎯 app/                          # Next.js 14 App Router
│   ├── 📡 api/                      # API Routes with comprehensive error handling
│   │   ├── meetings/               # Meeting management endpoints
│   │   ├── ai/                     # AI content generation endpoints
│   │   └── health/                 # Health check endpoints
│   ├── 🔐 auth/                    # Authentication pages
│   └── 📄 page.tsx                 # Main application page
├── 🧩 components/                   # React Components
│   ├── Dashboard.tsx               # Main dashboard component
│   ├── UpcomingMeetings.tsx        # Meeting list component
│   ├── PastMeetings.tsx            # Meeting history component
│   └── SettingsPage.tsx            # User settings component
├── 🔧 lib/                         # Core Libraries & Utilities
│   ├── 🛡️ security.ts              # Security middleware & utilities
│   ├── 📊 logger.ts                # Structured logging with Winston
│   ├── ⚡ rate-limiter.ts          # Rate limiting implementation
│   ├── 🔍 validation.ts            # Zod validation schemas
│   ├── 🗄️ database.ts              # Extended Prisma client
│   ├── 🌐 api-clients.ts           # External API integrations
│   ├── ⚠️ errors.ts                # Custom error handling
│   └── ⚙️ config.ts                # Environment configuration
├── 🗄️ prisma/                      # Database Schema & Migrations
├── 🧪 __tests__/                   # Comprehensive Test Suite
│   ├── 📡 api/                     # API route tests
│   ├── 🧩 components/              # Component tests
│   ├── 🔗 integration/             # Integration tests
│   ├── ⚡ performance/             # Performance tests
│   └── 🛡️ security/                # Security tests
├── 📚 docs/                        # Documentation
│   ├── API.md                      # Complete API documentation
│   └── DEPLOYMENT.md               # Deployment guide
├── 📊 monitoring/                  # Monitoring Configuration
│   ├── prometheus.yml              # Prometheus setup
│   └── rules/                      # Alert rules
├── 🚀 scripts/                     # Deployment Scripts
├── 🔄 .github/workflows/           # CI/CD Pipeline
└── 📋 Configuration Files
    ├── 🐳 Dockerfile.prod          # Production Docker image
    ├── 🐳 docker-compose.prod.yml  # Production deployment
    ├── ⚙️ next.config.js           # Next.js configuration
    ├── 🧪 jest.config.js           # Testing configuration
    └── 📦 package.json             # Dependencies & scripts
```

---

## 🔒 **Security Features**

<div align="center">

| Feature | Implementation | Status |
|---------|---------------|--------|
| **Rate Limiting** | Redis-based with sliding windows | ✅ |
| **CSRF Protection** | NextAuth.js middleware | ✅ |
| **Input Validation** | Zod schemas for all endpoints | ✅ |
| **SQL Injection Prevention** | Prisma parameterized queries | ✅ |
| **XSS Protection** | Input sanitization & CSP headers | ✅ |
| **Authentication** | NextAuth.js with secure sessions | ✅ |
| **Authorization** | Role-based access control | ✅ |
| **Security Headers** | Comprehensive security headers | ✅ |

</div>

---

## 📊 **Monitoring & Observability**

### **Logging System**
- **Structured Logging**: JSON-formatted logs with Winston
- **Log Rotation**: Daily rotation with configurable retention
- **Multiple Levels**: Error, warn, info, debug logging
- **Performance Tracking**: API response times and slow queries
- **Security Events**: Authentication and authorization logging

### **Health Monitoring**
- **Health Checks**: Comprehensive system health endpoints
- **Database Monitoring**: Connection status and query performance
- **External Services**: API availability and response times
- **Resource Monitoring**: Memory usage and performance metrics

---

## 🧪 **Testing Strategy**

<div align="center">

| Test Type | Coverage | Tools | Status |
|-----------|----------|-------|--------|
| **Unit Tests** | Components & Utils | Jest, Testing Library | ✅ |
| **Integration Tests** | API & Workflows | Supertest, Jest | ✅ |
| **Performance Tests** | Load & Stress | Jest, Custom | ✅ |
| **Security Tests** | Auth & Validation | Jest, Custom | ✅ |
| **E2E Tests** | User Journeys | Jest, Custom | ✅ |

</div>

### **Running Tests**

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:performance    # Performance tests
npm run test:security       # Security tests

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚀 **Deployment**

### **Production Environment**

```bash
# Build for production
npm run build

# Run production server
npm start

# Docker deployment
npm run docker:build
npm run docker:run
```

### **Environment Variables**

```env
# Production Configuration
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret-key"

# Monitoring
PROMETHEUS_ENABLED="true"
LOG_LEVEL="info"

# Performance
REDIS_URL="redis://your-redis-host:6379"
CACHE_TTL="3600"
```

### **Deployment Options**

| Platform | Configuration | Status |
|----------|---------------|--------|
| **Docker** | `docker-compose.prod.yml` | ✅ |
| **Vercel** | Serverless deployment | ✅ |
| **AWS ECS** | Container orchestration | ✅ |
| **Google Cloud Run** | Serverless containers | ✅ |
| **Kubernetes** | Helm charts available | ✅ |

---

## 📈 **Performance Optimization**

### **Database Optimization**
- **Connection Pooling**: Optimized database connections
- **Query Optimization**: Indexed queries and slow query monitoring
- **Caching Strategy**: Redis-based caching for frequently accessed data

### **Frontend Optimization**
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Analysis**: Webpack bundle analyzer for optimization

### **API Performance**
- **Response Caching**: API response caching strategies
- **Rate Limiting**: Configurable rate limits per endpoint
- **Performance Monitoring**: Real-time performance metrics

---

## 📚 **Documentation**

- **[API Documentation](docs/API.md)** - Complete API reference with examples
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Professional Summary](PROFESSIONAL_SUMMARY.md)** - Executive project overview
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Add tests** for new functionality
5. **Ensure** all tests pass (`npm run test:all`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain 80%+ test coverage
- Update documentation for new features
- Follow conventional commit messages

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support & Community**

### **Getting Help**
- 📖 **Documentation**: Check the comprehensive docs in `/docs`
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Discussions**: Join community discussions
- 📧 **Contact**: Reach out for enterprise support

### **Resources**
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Security Best Practices](docs/SECURITY.md)

---

## 🏆 **Project Highlights**

<div align="center">

### **This project demonstrates:**

✅ **Professional Software Engineering** - Clean architecture, SOLID principles, design patterns  
✅ **Enterprise-Grade Security** - Comprehensive security measures and best practices  
✅ **Production Readiness** - Complete deployment configuration and monitoring  
✅ **Comprehensive Testing** - 80%+ test coverage with multiple test types  
✅ **Modern DevOps** - CI/CD pipeline, Docker, monitoring, and alerting  
✅ **Scalable Architecture** - Microservices patterns and performance optimization  
✅ **Complete Documentation** - API docs, deployment guides, and troubleshooting  
✅ **Business Value** - Measurable ROI and productivity improvements  

</div>

---

<div align="center">

**🚀 Ready for Production | 🛡️ Security Hardened | 📊 Fully Monitored | 🧪 Thoroughly Tested**

*Built with ❤️ using modern software engineering practices*

[![GitHub stars](https://img.shields.io/github/stars/your-username/post-meeting-social-generator?style=social)](https://github.com/your-username/post-meeting-social-generator)
[![GitHub forks](https://img.shields.io/github/forks/your-username/post-meeting-social-generator?style=social)](https://github.com/your-username/post-meeting-social-generator)

</div>