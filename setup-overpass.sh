#!/bin/bash

echo "===== Overpass API Setup Script ====="
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
echo "Starting Overpass API container..."
docker-compose -f docker-compose.overpass.yml up -d
echo ""

# Check if the container is running
if docker ps | grep -q overpass-api; then
    echo "✅ Overpass API container is running."
    echo ""
    echo "The container is now initializing. This will take some time as it downloads and imports OSM data."
    echo "You can check the progress with:"
    echo "  docker logs -f overpass-api"
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