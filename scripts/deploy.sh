#!/bin/bash

# Production deployment script for Post-Meeting Social Media Generator
set -e

echo "🚀 Starting production deployment..."

# Configuration
APP_NAME="post-meeting-social-generator"
DOCKER_REGISTRY="your-registry.com"
VERSION=${1:-"latest"}
ENVIRONMENT=${2:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if [ ! -f ".env.production" ]; then
        log_error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    if ! npm test; then
        log_error "Tests failed"
        exit 1
    fi
    
    log_info "All tests passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Install dependencies
    npm ci --only=production
    
    # Generate Prisma client
    npx prisma generate
    
    # Build Next.js application
    npm run build
    
    log_info "Application built successfully"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image..."
    
    docker build -f Dockerfile.prod -t ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION} .
    docker tag ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION} ${DOCKER_REGISTRY}/${APP_NAME}:latest
    
    log_info "Docker image built successfully"
}

# Push Docker image
push_docker_image() {
    log_info "Pushing Docker image to registry..."
    
    docker push ${DOCKER_REGISTRY}/${APP_NAME}:${VERSION}
    docker push ${DOCKER_REGISTRY}/${APP_NAME}:latest
    
    log_info "Docker image pushed successfully"
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production..."
    
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:3000/api/health; then
        log_info "Application is healthy"
    else
        log_error "Application health check failed"
        exit 1
    fi
    
    log_info "Deployment completed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f docker-compose.prod.yml exec app npx prisma db push
    
    log_info "Database migrations completed"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    docker image prune -f
    docker system prune -f
    
    log_info "Cleanup completed"
}

# Rollback function
rollback() {
    log_warn "Rolling back deployment..."
    
    # Stop current containers
    docker-compose -f docker-compose.prod.yml down
    
    # Start previous version (you would need to implement version tracking)
    log_warn "Rollback completed"
}

# Main deployment flow
main() {
    case $ENVIRONMENT in
        "production")
            check_prerequisites
            run_tests
            build_application
            build_docker_image
            push_docker_image
            deploy_production
            run_migrations
            cleanup
            ;;
        "staging")
            log_info "Deploying to staging environment..."
            # Staging deployment logic
            ;;
        "rollback")
            rollback
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_info "Usage: $0 [version] [production|staging|rollback]"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main

log_info "🎉 Deployment completed successfully!"