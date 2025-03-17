# Local Overpass API Setup

This guide explains how to set up and use a local Overpass API instance using Docker.

## Prerequisites

- Docker Desktop for Mac
- Node.js (for running the check script)
- For Europe dataset: At least 100GB free disk space and 8GB RAM

## Setup Instructions

### Europe Dataset Setup (Large)

If you want to use the entire Europe dataset, we've created a specialized setup script:

```bash
# Make the script executable
chmod +x setup-europe-overpass.sh

# Run the Europe setup script
./setup-europe-overpass.sh
```

⚠️ **Important Notes for Europe Dataset**:
- The Europe dataset is approximately 24GB compressed and expands to ~100GB+ when imported
- Initial import can take several hours to days depending on your hardware
- You need at least 100GB of free disk space and 8GB of RAM
- The Docker Compose file has been configured with appropriate memory limits for this dataset

### Automatic Setup for Smaller Regions (Recommended)

For testing or if you only need a smaller region, use the standard setup script:

```bash
# Make the script executable if needed
chmod +x setup-overpass.sh

# Run the setup script
./setup-overpass.sh
```

The script will:
1. Check if Docker is installed and running
2. Fix Docker credential helper issues
3. Pull the Overpass API image
4. Start the Overpass API container
5. Verify that the container is running

### Manual Setup

If you prefer to set up manually, follow these steps:

1. **Install Docker Desktop for Mac**:
   - Download from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop

2. **Fix Docker credential helper issues** (if needed):
   ```bash
   # Make the script executable
   chmod +x fix-docker-credentials.sh
   
   # Run the fix script
   ./fix-docker-credentials.sh
   ```

3. **Choose your dataset**:
   Edit `docker-compose.overpass.yml` and set the appropriate `OVERPASS_PLANET_URL`:
   - For Europe (large): `https://download.geofabrik.de/europe-latest.osm.bz2`
   - For a single country: `https://download.geofabrik.de/europe/italy-latest.osm.bz2`
   - For a small region: `https://download.geofabrik.de/europe/monaco-latest.osm.bz2`

4. **Start the Overpass API container**:
   ```bash
   docker-compose -f docker-compose.overpass.yml up -d
   ```

5. **Check the initialization progress**:
   ```bash
   docker logs -f overpass-api
   ```
   
   The first time you run the container, it will download and import the OSM data. This can take some time depending on the region size:
   - Monaco: A few minutes
   - Single country: Several hours
   - Europe: Several hours to days

6. **Test the API**:
   ```bash
   node check-overpass.js
   ```
   
   This script will check if the Overpass API is running and responding correctly.

## Usage in the Application

The application has been configured to use the local Overpass API instance by default. The `OVERPASS_ENDPOINTS` array in `client/src/pages/Planning/Planning.jsx` has been updated to prioritize the local instance:

```javascript
const OVERPASS_ENDPOINTS = [
  'http://localhost:8080/api/interpreter', // Local Docker instance
  'https://overpass-api.de/api/interpreter',
  // ... other endpoints as fallbacks
];
```

## Customizing the Setup

### Available Regions

You can find all available regions at [https://download.geofabrik.de/](https://download.geofabrik.de/). Some common options:

- **Entire Continents**:
  - Europe: `https://download.geofabrik.de/europe-latest.osm.bz2`
  - North America: `https://download.geofabrik.de/north-america-latest.osm.bz2`
  - Asia: `https://download.geofabrik.de/asia-latest.osm.bz2`

- **Countries**:
  - Italy: `https://download.geofabrik.de/europe/italy-latest.osm.bz2`
  - France: `https://download.geofabrik.de/europe/france-latest.osm.bz2`
  - Germany: `https://download.geofabrik.de/europe/germany-latest.osm.bz2`

- **Small Regions** (for testing):
  - Monaco: `https://download.geofabrik.de/europe/monaco-latest.osm.bz2`
  - Luxembourg: `https://download.geofabrik.de/europe/luxembourg-latest.osm.bz2`

### Stopping the Container

To stop the Overpass API container:

```bash
docker-compose -f docker-compose.overpass.yml down
```

### Removing the Container and Data

To remove the container and all data:

```bash
docker-compose -f docker-compose.overpass.yml down -v
```

## Troubleshooting

### Docker Credential Helper Issues

If you see errors related to Docker credentials, run the fix script:

```bash
./fix-docker-credentials.sh
```

### Container Not Starting

If the container doesn't start, check the logs:

```bash
docker logs overpass-api
```

### API Not Responding

If the API doesn't respond, it might still be initializing. Check the logs to see the progress:

```bash
docker logs -f overpass-api
```

### Out of Memory

If the container runs out of memory, you can increase the memory limit in the `docker-compose.overpass.yml` file:

```yaml
services:
  overpass-api:
    # ... other settings
    deploy:
      resources:
        limits:
          memory: 12G  # Increase this value
```

### Import Taking Too Long

For large datasets like Europe, the import process can take a very long time. You can:

1. Check the progress with `docker logs -f overpass-api`
2. Consider using a smaller region for testing
3. Ensure your system has enough resources (CPU, RAM, disk space)

## Benefits of Local Overpass API

1. **No Rate Limits**: You won't be affected by the rate limits of public servers
2. **Faster Queries**: Local queries will be much faster than remote ones
3. **Offline Capability**: Your app can work without internet access
4. **Custom Data**: You can focus on regions that matter to your users 