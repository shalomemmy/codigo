#!/bin/bash

# Reputation DAO Deployment Script
# Codigo DevQuest #2

set -e

echo "🚀 Starting Reputation DAO deployment..."

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command -v rustc &> /dev/null; then
        print_error "Rust is not installed. Please install Rust 1.70+"
        exit 1
    fi
    
    if ! command -v solana &> /dev/null; then
        print_error "Solana CLI is not installed. Please install Solana CLI"
        exit 1
    fi
    
    if ! command -v anchor &> /dev/null; then
        print_error "Anchor is not installed. Please install Anchor Framework"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Install npm dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    npm install
    print_success "npm dependencies installed"
}

# Build the smart contract
build_contract() {
    print_status "Building smart contract..."
    anchor build
    print_success "Smart contract built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    anchor test
    print_success "All tests passed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    npm run build-frontend
    print_success "Frontend built successfully"
}

# Deploy to localnet
deploy_localnet() {
    print_status "Deploying to localnet..."
    
    # Start local validator if not running
    if ! pgrep -f "solana-test-validator" > /dev/null; then
        print_status "Starting local validator..."
        solana-test-validator &
        sleep 5
    fi
    
    anchor deploy
    print_success "Deployed to localnet successfully"
}

# Deploy to devnet
deploy_devnet() {
    print_status "Deploying to devnet..."
    anchor deploy --provider.cluster devnet
    print_success "Deployed to devnet successfully"
}

# Deploy to mainnet
deploy_mainnet() {
    print_warning "Deploying to mainnet..."
    read -p "Are you sure you want to deploy to mainnet? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        anchor deploy --provider.cluster mainnet
        print_success "Deployed to mainnet successfully"
    else
        print_status "Mainnet deployment cancelled"
    fi
}

# Start development server
start_dev() {
    print_status "Starting development server..."
    npm start
}

# Show help
show_help() {
    echo "Reputation DAO Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check       - Check if all dependencies are installed"
    echo "  install     - Install npm dependencies"
    echo "  build       - Build smart contract and frontend"
    echo "  test        - Run all tests"
    echo "  deploy-local - Deploy to localnet"
    echo "  deploy-dev  - Deploy to devnet"
    echo "  deploy-main - Deploy to mainnet"
    echo "  dev         - Start development server"
    echo "  all         - Run full deployment pipeline"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 build"
    echo "  $0 deploy-local"
    echo "  $0 all"
}

# Main deployment pipeline
run_pipeline() {
    print_status "Running full deployment pipeline..."
    
    check_dependencies
    install_dependencies
    build_contract
    run_tests
    build_frontend
    
    print_success "Full pipeline completed successfully!"
    print_status "You can now run: $0 dev"
}

# Parse command line arguments
case "${1:-help}" in
    "check")
        check_dependencies
        ;;
    "install")
        install_dependencies
        ;;
    "build")
        build_contract
        build_frontend
        ;;
    "test")
        run_tests
        ;;
    "deploy-local")
        deploy_localnet
        ;;
    "deploy-dev")
        deploy_devnet
        ;;
    "deploy-main")
        deploy_mainnet
        ;;
    "dev")
        start_dev
        ;;
    "all")
        run_pipeline
        ;;
    "help"|*)
        show_help
        ;;
esac 