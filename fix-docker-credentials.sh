#!/bin/bash

echo "Fixing Docker credential helper issue..."

# Create Docker config directory if it doesn't exist
mkdir -p ~/.docker

# Create or update Docker config file
cat > ~/.docker/config.json << EOF
{
  "credsStore": "",
  "auths": {}
}
EOF

echo "Docker credential configuration updated."
echo "Please make sure Docker Desktop is running."
echo ""
echo "After Docker Desktop is running, try again with:"
echo "docker-compose -f docker-compose.overpass.yml up -d" 