# Using a Virtual Machine for Overpass API

If you prefer not to use Docker, you can run Overpass API in a virtual machine with Linux. This approach gives you a full Linux environment where Overpass API can run natively.

## Steps to Set Up a Virtual Machine for Overpass API

1. **Install VirtualBox**:
   - Download from [https://www.virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)
   - Install VirtualBox on your Mac

2. **Download Ubuntu Server**:
   - Get the latest LTS version from [https://ubuntu.com/download/server](https://ubuntu.com/download/server)

3. **Create a New Virtual Machine**:
   - Open VirtualBox and click "New"
   - Name: "Overpass API"
   - Type: Linux
   - Version: Ubuntu (64-bit)
   - Memory: At least 4GB (more for larger datasets)
   - Create a virtual hard disk (at least 50GB for a small region, more for larger datasets)

4. **Install Ubuntu Server**:
   - Start the VM and select the Ubuntu ISO
   - Follow the installation prompts
   - Choose the minimal installation option

5. **Install Overpass API Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y build-essential cmake expat libexpat1-dev zlib1g-dev libbz2-dev
   ```

6. **Clone and Build Overpass API**:
   ```bash
   mkdir -p ~/overpass
   cd ~/overpass
   git clone https://github.com/drolbr/Overpass-API.git
   cd Overpass-API/src
   ./configure CXXFLAGS="-O3" && make
   ```

7. **Download OSM Data**:
   ```bash
   mkdir -p ~/overpass/db
   cd ~/overpass/db
   wget https://download.geofabrik.de/europe/monaco-latest.osm.bz2
   ```

8. **Initialize the Database**:
   ```bash
   cd ~/overpass/Overpass-API
   bin/init_osm3s.sh ~/overpass/db ~/overpass/db/monaco-latest.osm.bz2 --meta
   ```

9. **Start the Overpass API Server**:
   ```bash
   cd ~/overpass/db
   ~/overpass/Overpass-API/bin/dispatcher --osm-base --db-dir=.
   ~/overpass/Overpass-API/bin/dispatcher --areas --db-dir=.
   ~/overpass/Overpass-API/cgi-bin/interpreter
   ```

10. **Set Up Port Forwarding**:
    - In VirtualBox, go to the VM's settings
    - Navigate to Network > Adapter 1 > Advanced > Port Forwarding
    - Add a new rule:
      - Name: Overpass API
      - Protocol: TCP
      - Host IP: 127.0.0.1
      - Host Port: 8080
      - Guest IP: (leave empty)
      - Guest Port: 80

11. **Test the API**:
    Once the server is running, you can test it with:
    ```
    http://localhost:8080/api/interpreter?data=[out:json];node(47.5,9.5,47.6,9.6);out;
    ```

12. **Update Your Application**:
    Update your application to use the local endpoint:
    ```javascript
    const OVERPASS_ENDPOINTS = [
      'http://localhost:8080/api/interpreter',  // Local instance
      // ... other endpoints as fallbacks
    ];
    ```

## Pros and Cons of Using a VM

### Pros:
- Full Linux environment where Overpass API runs natively
- Complete isolation from your host system
- Can run other Linux-specific tools alongside Overpass API

### Cons:
- More resource-intensive than Docker
- More complex setup process
- Requires manual updates
- Takes longer to start up

## Tips for VM Management

- **Snapshots**: Take VM snapshots before major changes
- **Shared Folders**: Set up shared folders between your Mac and VM for easier file transfer
- **Headless Mode**: Run the VM in headless mode to save resources
- **Automation**: Create startup scripts to automatically start the Overpass API services 