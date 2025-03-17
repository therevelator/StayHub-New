# Setting Up Overpass API Locally (Without Docker)

This guide explains how to set up an Overpass API instance locally on macOS.

## Prerequisites

You'll need to install several dependencies:

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required dependencies
brew install expat fcgi zlib boost cmake bzip2 wget
```

## Step 1: Clone and Build Overpass API

```bash
# Create a directory for Overpass
mkdir -p ~/overpass
cd ~/overpass

# Clone the repository
git clone https://github.com/drolbr/Overpass-API.git
cd Overpass-API

# Create build directory
mkdir build
cd build

# Configure and build
cmake ..
make
```

## Step 2: Set Up the Database

```bash
# Create directories for the database
mkdir -p ~/overpass/db
cd ~/overpass/db

# Download a small OSM extract for testing
# For this example, we'll use Monaco (very small)
wget https://download.geofabrik.de/europe/monaco-latest.osm.bz2

# Initialize the database
~/overpass/Overpass-API/build/bin/init_osm3s.sh ~/overpass/db ~/overpass/db/monaco-latest.osm.bz2
```

## Step 3: Start the Overpass API Server

```bash
# Start the dispatcher
~/overpass/Overpass-API/build/bin/dispatcher --osm-base --db-dir=~/overpass/db &

# Start the API server (FCGI)
~/overpass/Overpass-API/build/bin/fcgi-bin/interpreter --db-dir=~/overpass/db &
```

## Step 4: Set Up a Web Server (Optional but Recommended)

You'll need a web server like Nginx to proxy requests to the FCGI process:

```bash
# Install Nginx
brew install nginx

# Configure Nginx
```

Create a configuration file at `/usr/local/etc/nginx/servers/overpass.conf`:

```nginx
server {
    listen 8080;
    server_name localhost;

    location / {
        root /usr/local/var/www;
        index index.html;
    }

    location /api/interpreter {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:8000;
    }
}
```

Start Nginx:

```bash
nginx
```

## Step 5: Update Your Application to Use the Local API

Modify your application to use the local Overpass API endpoint:

```javascript
const OVERPASS_ENDPOINTS = [
  'http://localhost:8080/api/interpreter',  // Local instance first
  'https://overpass-api.de/api/interpreter', // Fallbacks
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];
```

## Notes and Considerations

1. **Data Size**: The full planet OSM data is very large (>50GB). Consider using regional extracts from Geofabrik for your areas of interest.

2. **Updates**: To keep your data up-to-date, you'll need to set up a cron job to apply diffs:
   ```bash
   # Example cron job to update the database daily
   0 3 * * * ~/overpass/Overpass-API/build/bin/update_from_dir.sh ~/overpass/db ~/overpass/diffs
   ```

3. **Hardware Requirements**: A full planet installation requires significant resources:
   - At least 32GB RAM
   - 500GB+ SSD storage
   - Multi-core CPU

4. **Alternatives**: If direct installation is too complex, consider:
   - Using a pre-built VM image
   - Using a managed service
   - Falling back to public instances with proper caching

5. **Troubleshooting**: Common issues include:
   - Memory limitations during import
   - Permissions problems
   - Network timeouts during updates

For production use, you might want to consider a more robust setup with monitoring and automatic failover. 