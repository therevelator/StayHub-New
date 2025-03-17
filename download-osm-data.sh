#!/bin/bash
# Script to download OSM data for specific regions

# Create directories
mkdir -p ~/overpass/data
cd ~/overpass/data

# Function to download and extract OSM data
download_region() {
  local region=$1
  local url=$2
  
  echo "Downloading $region data..."
  wget -O "$region.osm.pbf" "$url"
  
  echo "Converting $region data to OSM format..."
  osmium cat "$region.osm.pbf" -o "$region.osm"
  
  echo "$region data ready!"
}

# Ask user which regions to download
echo "Which regions would you like to download?"
echo "1) Monaco (smallest, ~2MB)"
echo "2) Luxembourg (small, ~60MB)"
echo "3) Switzerland (medium, ~400MB)"
echo "4) France (large, ~4GB)"
echo "5) Europe (very large, ~20GB)"
echo "6) Planet (entire world, ~60GB+)"
echo "7) Custom URL"
echo "Enter your choice (1-7):"
read choice

case $choice in
  1)
    download_region "monaco" "https://download.geofabrik.de/europe/monaco-latest.osm.pbf"
    ;;
  2)
    download_region "luxembourg" "https://download.geofabrik.de/europe/luxembourg-latest.osm.pbf"
    ;;
  3)
    download_region "switzerland" "https://download.geofabrik.de/europe/switzerland-latest.osm.pbf"
    ;;
  4)
    download_region "france" "https://download.geofabrik.de/europe/france-latest.osm.pbf"
    ;;
  5)
    download_region "europe" "https://download.geofabrik.de/europe-latest.osm.pbf"
    ;;
  6)
    echo "Warning: Planet file is very large (60GB+) and requires significant disk space and memory!"
    echo "Are you sure you want to continue? (y/n)"
    read confirm
    if [ "$confirm" = "y" ]; then
      download_region "planet" "https://planet.openstreetmap.org/pbf/planet-latest.osm.pbf"
    else
      echo "Download cancelled."
      exit 0
    fi
    ;;
  7)
    echo "Enter the URL for the OSM data file:"
    read custom_url
    echo "Enter a name for this region (no spaces):"
    read custom_name
    download_region "$custom_name" "$custom_url"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "Next steps:"
echo "1. Install Overpass API following the instructions in local-overpass-setup.md"
echo "2. Initialize the database with your downloaded data:"
echo "   ~/overpass/Overpass-API/build/bin/init_osm3s.sh ~/overpass/db ~/overpass/data/$region.osm"
echo ""
echo "Note: Larger regions require more memory and disk space for processing." 