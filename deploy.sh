#!/bin/bash

# Pint Platform Deployment Script
# This script automates the build and deployment process for all applications

set -e  # Exit on any error

# Configuration
DEPLOY_ENV=${1:-production}
SKIP_TESTS=${2:-false}

echo "🚀 Starting Pint Platform Deployment"
echo "Environment: $DEPLOY_ENV"
echo "Skip Tests: $SKIP_TESTS"
echo "----------------------------------------"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ required. Current: $(node --version)"
        exit 1
    fi
    
    # Check Angular CLI
    if ! command -v ng &> /dev/null; then
        log_error "Angular CLI is not installed. Run: npm install -g @angular/cli"
        exit 1
    fi
    
    # Check environment variables for production
    if [ "$DEPLOY_ENV" = "production" ]; then
        required_vars=("ADMIN_EMAIL" "ADMIN_PASSWORD")
        for var in "${required_vars[@]}"; do
            if [ -z "${!var}" ]; then
                log_error "Required environment variable $var is not set"
                exit 1
            fi
        done
    fi
    
    log_success "Prerequisites check passed"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    # API dependencies
    cd api
    npm ci --production=false
    cd ..
    
    # Main app dependencies
    cd app
    npm ci --production=false
    cd ..
    
    # Partner dashboard dependencies
    cd pint-dashboard
    npm ci --production=false
    cd ..
    
    # Admin dashboard dependencies
    cd admin-dashboard
    npm ci --production=false
    cd ..
    
    log_success "Dependencies installed"
}

run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping tests as requested"
        return
    fi
    
    log_info "Running tests..."
    
    # Lint all applications
    cd app
    npm run lint
    cd ..
    
    # Run unit tests for main app
    cd app
    npm test -- --watch=false --browsers=ChromeHeadless
    cd ..
    
    # Note: E2E tests require all services to be running
    # They should be run in a separate CI/CD pipeline
    log_warning "E2E tests skipped - run manually with: cd app && npm run e2e:master"
    
    log_success "Tests completed"
}

build_applications() {
    log_info "Building applications for $DEPLOY_ENV..."
    
    BUILD_CONFIG="production"
    if [ "$DEPLOY_ENV" != "production" ]; then
        BUILD_CONFIG="development"
    fi
    
    # Build main user app
    log_info "Building main user app..."
    cd app
    ng build --configuration=$BUILD_CONFIG
    cd ..
    log_success "Main user app built"
    
    # Build partner dashboard
    log_info "Building partner dashboard..."
    cd pint-dashboard
    ng build --configuration=$BUILD_CONFIG
    cd ..
    log_success "Partner dashboard built"
    
    # Build admin dashboard
    log_info "Building admin dashboard..."
    cd admin-dashboard
    ng build --configuration=$BUILD_CONFIG
    cd ..
    log_success "Admin dashboard built"
    
    log_success "All applications built successfully"
}

setup_database() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        log_info "Setting up production database..."
        cd api
        npm run seed:prod
        cd ..
        log_success "Database setup completed"
    else
        log_info "Setting up development database..."
        cd api
        npm run seed
        cd ..
        log_success "Development database setup completed"
    fi
}

generate_deployment_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
Pint Platform Deployment Report
===============================
Deployment Date: $(date)
Environment: $DEPLOY_ENV
Node.js Version: $(node --version)
Angular CLI Version: $(ng version --json | jq -r '.packages."@angular/cli".version' 2>/dev/null || echo "N/A")

Build Artifacts:
- Main App: app/dist/
- Partner Dashboard: pint-dashboard/dist/
- Admin Dashboard: admin-dashboard/dist/
- API: api/ (no build required)
- Website: website/ (static files)

Bundle Sizes:
$(cd app && find dist -name "*.js" -type f -exec wc -c {} + | sort -nr | head -5)

Deployment Checklist:
☑ Dependencies installed
☑ Applications built
☑ Database seeded
☐ Deploy to production servers
☐ Configure CORS settings
☐ Set up monitoring
☐ Verify health checks
☐ Run integration tests

Next Steps:
1. Upload build artifacts to production servers
2. Configure environment variables on production
3. Start API server with process manager (PM2)
4. Configure web servers for frontend applications
5. Set up SSL certificates
6. Configure monitoring and alerting
EOF

    log_success "Deployment report generated: $REPORT_FILE"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove node_modules/.cache if it exists
    find . -name ".angular" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -path "*/node_modules/.cache" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log_success "Cleanup completed"
}

main() {
    echo "Starting deployment process..."
    
    check_prerequisites
    install_dependencies
    run_tests
    build_applications
    setup_database
    generate_deployment_report
    cleanup
    
    echo ""
    echo "🎉 Deployment preparation completed successfully!"
    echo ""
    echo "Build artifacts are ready in the following directories:"
    echo "  - Main App: app/dist/"
    echo "  - Partner Dashboard: pint-dashboard/dist/"
    echo "  - Admin Dashboard: admin-dashboard/dist/"
    echo "  - API: api/ (ready to deploy)"
    echo "  - Website: website/ (static files)"
    echo ""
    echo "Next: Follow the deployment guide in README.md"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"