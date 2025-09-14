#!/bin/bash

# Firebase Integration Validation Test Runner
# Comprehensive test suite for post-migration Firebase integration validation

set -e

echo "🔥 Firebase Integration Validation Test Suite"
echo "=============================================="
echo ""

# Configuration
MAIN_APP_PORT=8100
PARTNER_DASHBOARD_PORT=4200
ADMIN_DASHBOARD_PORT=4201
API_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0 # Port is in use
    else
        return 1 # Port is available
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $name to be ready at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404\|403"; then
            print_success "$name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$name failed to start within expected time"
    return 1
}

# Function to start application
start_app() {
    local app_name=$1
    local directory=$2
    local port=$3
    local start_command=$4
    
    print_status "Starting $app_name on port $port..."
    
    if check_port $port; then
        print_warning "$app_name already running on port $port"
        return 0
    fi
    
    cd "$directory"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $app_name..."
        npm install
    fi
    
    # Start the application in background
    eval "$start_command" > "/tmp/${app_name,,}-server.log" 2>&1 &
    local pid=$!
    echo $pid > "/tmp/${app_name,,}-server.pid"
    
    # Wait for service to be ready
    wait_for_service "http://localhost:$port" "$app_name"
    
    cd - > /dev/null
}

# Function to stop application
stop_app() {
    local app_name=$1
    local pid_file="/tmp/${app_name,,}-server.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            print_status "Stopping $app_name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
        fi
    fi
}

# Function to run test suite
run_test_suite() {
    local test_file=$1
    local description=$2
    
    print_status "Running $description..."
    echo "----------------------------------------"
    
    if npx playwright test "$test_file" --reporter=line; then
        print_success "$description completed successfully"
    else
        print_error "$description failed"
        return 1
    fi
    
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Cleaning up services..."
    stop_app "main-app"
    stop_app "partner-dashboard"
    stop_app "admin-dashboard"
    stop_app "api"
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    echo "📋 Pre-flight checks..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the app directory"
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npx playwright --version > /dev/null 2>&1; then
        print_error "Playwright is not installed. Run: npm install"
        exit 1
    fi
    
    # Check if browsers are installed
    print_status "Checking Playwright browsers..."
    npx playwright install
    
    print_success "Pre-flight checks completed"
    echo ""
    
    # Start applications
    echo "🚀 Starting platform applications..."
    
    # Start main user app (required for all tests)
    start_app "Main App" "." $MAIN_APP_PORT "npm start"
    
    # For comprehensive testing, also start partner and admin dashboards
    # (Comment out if running focused tests only)
    if [ -d "../pint-dashboard" ]; then
        start_app "Partner Dashboard" "../pint-dashboard" $PARTNER_DASHBOARD_PORT "npm start"
    else
        print_warning "Partner dashboard directory not found, skipping..."
    fi
    
    if [ -d "../admin-dashboard" ]; then
        start_app "Admin Dashboard" "../admin-dashboard" $ADMIN_DASHBOARD_PORT "npm start"
    else
        print_warning "Admin dashboard directory not found, skipping..."
    fi
    
    # Start API if available
    if [ -d "../api" ]; then
        start_app "API" "../api" $API_PORT "node index.js"
    else
        print_warning "API directory not found, skipping..."
    fi
    
    print_success "All available applications started"
    echo ""
    
    # Run test suites
    echo "🧪 Running Firebase Integration Test Suites..."
    echo "=============================================="
    
    # 1. Real-time Data Sync Validation
    run_test_suite "realtime-sync-validation.spec.ts" "Real-time Data Synchronization Tests"
    
    # 2. Security Rules Penetration Testing
    run_test_suite "security-rules-validation.spec.ts" "Security Rules Penetration Tests"
    
    # 3. Geospatial Query Accuracy Tests
    run_test_suite "geospatial-validation.spec.ts" "Geospatial Query Accuracy Tests"
    
    # 4. Comprehensive Firebase Integration Tests
    run_test_suite "firebase-integration-validation.spec.ts" "End-to-End Firebase Integration Tests"
    
    # 5. Master Business Flow (if all apps are available)
    if check_port $PARTNER_DASHBOARD_PORT && check_port $ADMIN_DASHBOARD_PORT; then
        run_test_suite "master-business-flow.spec.ts" "Master Business Flow Integration Tests"
    else
        print_warning "Skipping master business flow tests (requires all applications running)"
    fi
    
    echo "🎉 Firebase Integration Validation Complete!"
    echo "============================================"
    
    # Generate summary report
    print_status "Generating test report..."
    npx playwright show-report --host 0.0.0.0 &
    
    print_success "Test report available at: http://localhost:9323"
    print_success "All Firebase integration validation tests completed successfully!"
    
    echo ""
    echo "📊 Test Results Summary:"
    echo "- Real-time data synchronization: ✅ Validated"
    echo "- Security rules enforcement: ✅ Validated"  
    echo "- Geospatial query accuracy: ✅ Validated"
    echo "- End-to-end platform cohesion: ✅ Validated"
    echo ""
    echo "🔥 Firebase integration is ready for production!"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Firebase Integration Validation Test Runner"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --quick             Run quick validation tests only"
        echo "  --security          Run security tests only"
        echo "  --geospatial        Run geospatial tests only"
        echo "  --realtime          Run real-time sync tests only"
        echo ""
        echo "Examples:"
        echo "  $0                  Run full validation suite"
        echo "  $0 --quick          Run essential tests only"
        echo "  $0 --security       Run security penetration tests"
        exit 0
        ;;
    --quick)
        print_status "Running quick validation tests..."
        start_app "Main App" "." $MAIN_APP_PORT "npm start"
        run_test_suite "critical-flows.spec.ts" "Critical User Flows"
        exit 0
        ;;
    --security)
        print_status "Running security validation tests..."
        start_app "Main App" "." $MAIN_APP_PORT "npm start"
        run_test_suite "security-rules-validation.spec.ts" "Security Rules Validation"
        exit 0
        ;;
    --geospatial)
        print_status "Running geospatial validation tests..."
        start_app "Main App" "." $MAIN_APP_PORT "npm start"
        run_test_suite "geospatial-validation.spec.ts" "Geospatial Query Validation"
        exit 0
        ;;
    --realtime)
        print_status "Running real-time sync validation tests..."
        start_app "Main App" "." $MAIN_APP_PORT "npm start"
        run_test_suite "realtime-sync-validation.spec.ts" "Real-time Synchronization Validation"
        exit 0
        ;;
    "")
        # Run full suite
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac