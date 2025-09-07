#!/bin/bash

# Enterprise Deployment Script
# This script demonstrates enterprise-grade deployment practices

set -e  # Exit on any error

echo "🚀 Starting Enterprise Deployment Process..."
echo "=============================================="

# Configuration
ENVIRONMENT=${1:-production}
REGION=${2:-us-east-1}
CLUSTER_NAME="postmeeting-cluster"
NAMESPACE="postmeeting"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check required environment variables
    required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
        "LINKEDIN_CLIENT_ID"
        "LINKEDIN_CLIENT_SECRET"
        "FACEBOOK_CLIENT_ID"
        "FACEBOOK_CLIENT_SECRET"
        "RECALL_API_KEY"
        "OPENAI_API_KEY"
        "REDIS_URL"
        "MASTER_ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check dependencies
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        error "Helm is not installed"
        exit 1
    fi
    
    success "Pre-deployment checks passed"
}

# Security scanning
security_scan() {
    log "Running security scans..."
    
    # Docker image security scan
    if command -v trivy &> /dev/null; then
        log "Scanning Docker image for vulnerabilities..."
        docker build -t postmeeting:latest .
        trivy image postmeeting:latest --severity HIGH,CRITICAL
    else
        warning "Trivy not installed, skipping vulnerability scan"
    fi
    
    # Code quality scan
    if command -v sonar-scanner &> /dev/null; then
        log "Running SonarQube code quality scan..."
        sonar-scanner -Dsonar.projectKey=postmeeting -Dsonar.sources=. -Dsonar.host.url=$SONAR_HOST_URL
    else
        warning "SonarQube scanner not installed, skipping code quality scan"
    fi
    
    success "Security scans completed"
}

# Build and test
build_and_test() {
    log "Building application..."
    
    # Install dependencies
    npm ci --only=production
    
    # Run tests
    log "Running test suite..."
    npm run test:coverage
    
    # Check test coverage
    coverage_threshold=80
    coverage=$(npm run test:coverage 2>&1 | grep -o 'All files[^%]*' | grep -o '[0-9]*\.[0-9]*%' | head -1 | sed 's/%//')
    
    if (( $(echo "$coverage < $coverage_threshold" | bc -l) )); then
        error "Test coverage ($coverage%) is below threshold ($coverage_threshold%)"
        exit 1
    fi
    
    # Build application
    npm run build
    
    # Generate Prisma client
    npx prisma generate
    
    success "Build and tests completed successfully"
}

# Database migration
database_migration() {
    log "Running database migrations..."
    
    # Check database connectivity
    npx prisma db push --preview-feature
    
    # Run migrations
    npx prisma migrate deploy
    
    # Seed database if needed
    if [ "$ENVIRONMENT" = "development" ]; then
        npx prisma db seed
    fi
    
    success "Database migrations completed"
}

# Docker build and push
docker_build_push() {
    log "Building and pushing Docker image..."
    
    # Build Docker image
    docker build -t postmeeting:$ENVIRONMENT .
    docker tag postmeeting:$ENVIRONMENT postmeeting:latest
    
    # Push to registry
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        docker tag postmeeting:$ENVIRONMENT $DOCKER_REGISTRY/postmeeting:$ENVIRONMENT
        docker push $DOCKER_REGISTRY/postmeeting:$ENVIRONMENT
        success "Docker image pushed to registry"
    else
        warning "DOCKER_REGISTRY not set, skipping push"
    fi
}

# Kubernetes deployment
kubernetes_deploy() {
    log "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets
    kubectl create secret generic postmeeting-secrets \
        --from-literal=DATABASE_URL="$DATABASE_URL" \
        --from-literal=NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
        --from-literal=GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
        --from-literal=LINKEDIN_CLIENT_SECRET="$LINKEDIN_CLIENT_SECRET" \
        --from-literal=FACEBOOK_CLIENT_SECRET="$FACEBOOK_CLIENT_SECRET" \
        --from-literal=RECALL_API_KEY="$RECALL_API_KEY" \
        --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" \
        --from-literal=MASTER_ENCRYPTION_KEY="$MASTER_ENCRYPTION_KEY" \
        -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configmap
    kubectl create configmap postmeeting-config \
        --from-literal=NEXTAUTH_URL="$NEXTAUTH_URL" \
        --from-literal=GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
        --from-literal=LINKEDIN_CLIENT_ID="$LINKEDIN_CLIENT_ID" \
        --from-literal=FACEBOOK_CLIENT_ID="$FACEBOOK_CLIENT_ID" \
        --from-literal=REDIS_URL="$REDIS_URL" \
        -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy with Helm
    if [ -f "helm/Chart.yaml" ]; then
        helm upgrade --install postmeeting ./helm \
            --namespace $NAMESPACE \
            --set image.tag=$ENVIRONMENT \
            --set environment=$ENVIRONMENT \
            --set replicas=3 \
            --set resources.requests.memory=512Mi \
            --set resources.requests.cpu=250m \
            --set resources.limits.memory=1Gi \
            --set resources.limits.cpu=500m
    else
        # Fallback to kubectl apply
        envsubst < k8s/deployment.yaml | kubectl apply -f -
        envsubst < k8s/service.yaml | kubectl apply -f -
        envsubst < k8s/ingress.yaml | kubectl apply -f -
    fi
    
    # Wait for deployment to be ready
    kubectl rollout status deployment/postmeeting -n $NAMESPACE --timeout=300s
    
    success "Kubernetes deployment completed"
}

# Health checks
health_checks() {
    log "Running health checks..."
    
    # Get service URL
    SERVICE_URL=$(kubectl get service postmeeting -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    if [ -z "$SERVICE_URL" ]; then
        SERVICE_URL="localhost:3000"
    fi
    
    # Wait for service to be ready
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://$SERVICE_URL/api/health" > /dev/null; then
            success "Health check passed"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed after $max_attempts attempts"
            exit 1
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    # Run comprehensive health checks
    log "Running comprehensive health checks..."
    
    # Check database connectivity
    curl -f -s "http://$SERVICE_URL/api/health/database" || error "Database health check failed"
    
    # Check external APIs
    curl -f -s "http://$SERVICE_URL/api/health/external" || error "External API health check failed"
    
    # Check metrics endpoint
    curl -f -s "http://$SERVICE_URL/api/metrics" || error "Metrics endpoint check failed"
    
    success "All health checks passed"
}

# Monitoring setup
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Deploy Prometheus if not exists
    if ! kubectl get deployment prometheus -n monitoring &> /dev/null; then
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
    fi
    
    # Deploy Grafana if not exists
    if ! kubectl get deployment grafana -n monitoring &> /dev/null; then
        helm repo add grafana https://grafana.github.io/helm-charts
        helm install grafana grafana/grafana -n monitoring
    fi
    
    # Configure service monitors
    kubectl apply -f monitoring/servicemonitor.yaml -n $NAMESPACE
    
    success "Monitoring setup completed"
}

# Backup setup
setup_backup() {
    log "Setting up backup..."
    
    # Create backup job
    kubectl apply -f backup/backup-job.yaml -n $NAMESPACE
    
    # Schedule regular backups
    kubectl apply -f backup/backup-schedule.yaml -n $NAMESPACE
    
    success "Backup setup completed"
}

# Security hardening
security_hardening() {
    log "Applying security hardening..."
    
    # Network policies
    kubectl apply -f security/network-policies.yaml -n $NAMESPACE
    
    # Pod security policies
    kubectl apply -f security/pod-security-policies.yaml -n $NAMESPACE
    
    # RBAC
    kubectl apply -f security/rbac.yaml -n $NAMESPACE
    
    success "Security hardening completed"
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Send deployment notification
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Post-Meeting Social Media Generator deployed to $ENVIRONMENT successfully!\"}" \
            $SLACK_WEBHOOK
    fi
    
    # Update deployment status
    echo "Deployment completed at $(date)" > deployment-status.txt
    
    success "Post-deployment tasks completed"
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    # Rollback Kubernetes deployment
    kubectl rollout undo deployment/postmeeting -n $NAMESPACE
    
    # Wait for rollback to complete
    kubectl rollout status deployment/postmeeting -n $NAMESPACE --timeout=300s
    
    # Verify rollback
    if kubectl get pods -n $NAMESPACE -l app=postmeeting | grep -q Running; then
        success "Rollback completed successfully"
    else
        error "Rollback failed"
        exit 1
    fi
}

# Main deployment flow
main() {
    log "Starting enterprise deployment to $ENVIRONMENT environment"
    
    # Set up error handling
    trap rollback ERR
    
    # Execute deployment steps
    pre_deployment_checks
    security_scan
    build_and_test
    database_migration
    docker_build_push
    kubernetes_deploy
    health_checks
    setup_monitoring
    setup_backup
    security_hardening
    post_deployment
    
    success "🎉 Enterprise deployment completed successfully!"
    log "Application is now running in $ENVIRONMENT environment"
    log "Monitor the deployment at: http://$SERVICE_URL"
    log "Grafana dashboard: http://grafana.monitoring.svc.cluster.local"
    log "Prometheus metrics: http://prometheus.monitoring.svc.cluster.local"
}

# Run main function
main "$@"
