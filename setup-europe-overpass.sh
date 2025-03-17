#!/bin/bash

echo "===== Europe Overpass API Setup Script ====="
echo ""
echo "⚠️  WARNING: You are about to download and import the ENTIRE EUROPE dataset!"
echo "⚠️  This requires:"
echo "   - At least 100GB of free disk space"
echo "   - At least 8GB of RAM"
echo "   - Several hours to days for initial import"
echo ""
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo "Proceeding with Europe dataset setup..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in your PATH."
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
    echo "After installation, run this script again."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running."
    echo "Please start Docker Desktop and wait for it to initialize."
    echo "After Docker is running, run this script again."
    exit 1
fi

echo "✅ Docker is installed and running."
echo ""

# Check available disk space
available_space=$(df -k . | awk 'NR==2 {print $4}')
available_space_gb=$((available_space / 1024 / 1024))
echo "Available disk space: ${available_space_gb}GB"

if [ "$available_space_gb" -lt 100 ]; then
    echo "❌ Warning: You have less than 100GB of free disk space."
    echo "The Europe dataset requires at least 100GB of free space."
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Fix Docker credential helper issue
echo "Fixing Docker credential helper configuration..."
mkdir -p ~/.docker
cat > ~/.docker/config.json << EOF
{
  "credsStore": "",
  "auths": {}
}
EOF
echo "✅ Docker credential configuration updated."
echo ""

# Pull the Overpass API image
echo "Pulling Overpass API Docker image..."
docker pull wiktorn/overpass-api
echo "✅ Overpass API image pulled."
echo ""

# Start the Overpass API container
echo "Starting Overpass API container with Europe dataset..."
docker-compose -f docker-compose.overpass.yml up -d
echo ""

# Check if the container is running
if docker ps | grep -q overpass-api; then
    echo "✅ Overpass API container is running."
    echo ""
    echo "⚠️  IMPORTANT: The container is now downloading and importing the ENTIRE EUROPE dataset."
    echo "⚠️  This process will take SEVERAL HOURS to DAYS to complete."
    echo ""
    echo "You can check the progress with:"
    echo "  docker logs -f overpass-api"
    echo ""
    echo "The import process has these main phases:"
    echo "1. Downloading the Europe dataset (~24GB compressed)"
    echo "2. Extracting the dataset"
    echo "3. Importing nodes (can take many hours)"
    echo "4. Importing ways (can take many hours)"
    echo "5. Importing relations"
    echo "6. Creating indexes"
    echo ""
    echo "Once initialization is complete, you can test the API with:"
    echo "  node check-overpass.js"
    echo ""
    echo "Your application is already configured to use the local Overpass API instance."
else
    echo "❌ Failed to start Overpass API container."
    echo "Please check the logs for more information:"
    echo "  docker logs overpass-api"
fi 