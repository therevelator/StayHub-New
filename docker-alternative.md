# Using Docker for Overpass API (Easiest Method)

Despite the initial preference to avoid Docker, it's worth reconsidering as it's by far the easiest and most reliable way to run Overpass API locally, especially on macOS where building from source has compatibility issues.

## Steps to Run Overpass API with Docker

1. **Install Docker Desktop for Mac**:
   - Download from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop

2. **Create a docker-compose.yml file**:
   ```yaml
   version: '3'
   
   services:
     overpass-api:
       image: wiktorn/overpass-api
       container_name: overpass-api
       ports:
         - "8080:80"
       volumes:
         - overpass-data:/db
       environment:
         - OVERPASS_META=yes
         - OVERPASS_MODE=init
         - OVERPASS_PLANET_URL=https://download.geofabrik.de/europe/monaco-latest.osm.bz2
         - OVERPASS_DIFF_URL=https://download.openstreetmap.fr/replication/europe/monaco/minute/
         - OVERPASS_RULES_LOAD=10
         - OVERPASS_UPDATE_SLEEP=60
       restart: unless-stopped
   
   volumes:
     overpass-data:
   ```

3. **Start the Overpass API container**:
   ```bash
   docker-compose up -d
   ```

4. **Wait for initialization to complete**:
   The first time you run the container, it will download and import the OSM data. This can take some time depending on the region size.
   
   You can check the progress with:
   ```bash
   docker logs -f overpass-api
   ```

5. **Test the API**:
   Once initialization is complete, you can test the API with a simple query:
   ```
   http://localhost:8080/api/interpreter?data=[out:json];node(47.5,9.5,47.6,9.6);out;
   ```

6. **Update your application**:
   Update your application to use the local endpoint:
   ```javascript
   const OVERPASS_ENDPOINTS = [
     'http://localhost:8080/api/interpreter',  // Local instance
     // ... other endpoints as fallbacks
   ];
   ```

## Benefits of Using Docker

1. **No Compatibility Issues**: Works the same on all platforms (macOS, Windows, Linux)
2. **Easy Updates**: Simply pull the latest image to update
3. **Isolated Environment**: Doesn't affect your system
4. **Persistent Data**: Data is stored in a Docker volume
5. **Automatic Updates**: The container can automatically update the OSM data

## Customizing the Setup

- **Change the Region**: Modify `OVERPASS_PLANET_URL` to use a different region
- **Adjust Memory Usage**: Add memory limits to the container configuration
- **Configure Update Frequency**: Modify `OVERPASS_UPDATE_SLEEP` to change how often data is updated 