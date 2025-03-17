#!/usr/bin/env node

/**
 * This script checks the import progress of the Overpass API by parsing the Docker logs.
 * It's particularly useful for monitoring large imports like the Europe dataset.
 */

const { execSync } = require('child_process');
const readline = require('readline');

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Check if the container is running
try {
  const containerStatus = execSync('docker ps -f name=overpass-api --format "{{.Status}}"').toString().trim();
  
  if (!containerStatus) {
    console.log(`${colors.red}${colors.bright}Error: Overpass API container is not running.${colors.reset}`);
    console.log(`${colors.yellow}Try starting it with: ${colors.reset}docker-compose -f docker-compose.overpass.yml up -d`);
    process.exit(1);
  }
  
  console.log(`${colors.green}${colors.bright}✓ Overpass API container is running${colors.reset}`);
  console.log(`${colors.dim}Container status: ${containerStatus}${colors.reset}\n`);
} catch (error) {
  console.log(`${colors.red}${colors.bright}Error checking container status: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Get the last 1000 lines of logs to analyze
try {
  console.log(`${colors.cyan}${colors.bright}Analyzing Overpass API import progress...${colors.reset}\n`);
  
  const logs = execSync('docker logs overpass-api --tail 1000').toString();
  const lines = logs.split('\n');
  
  // Check for different phases of the import process
  const downloadMatch = logs.match(/Downloading ([^ ]+)/);
  const extractMatch = logs.match(/Extracting/);
  const importStartMatch = logs.match(/Start import of/);
  const nodesMatch = logs.match(/Processing nodes: (\d+)k\s+nodes/);
  const waysMatch = logs.match(/Processing ways: (\d+)k\s+ways/);
  const relationsMatch = logs.match(/Processing relations: (\d+)k\s+relations/);
  const readyMatch = logs.match(/Listening on/);
  
  // Determine the current phase
  let currentPhase = 'Unknown';
  let progress = 'Unknown';
  
  if (readyMatch) {
    currentPhase = 'Ready';
    progress = '100%';
  } else if (relationsMatch) {
    currentPhase = 'Importing Relations';
    progress = `${relationsMatch[1]}k relations processed`;
  } else if (waysMatch) {
    currentPhase = 'Importing Ways';
    progress = `${waysMatch[1]}k ways processed`;
  } else if (nodesMatch) {
    currentPhase = 'Importing Nodes';
    progress = `${nodesMatch[1]}k nodes processed`;
  } else if (importStartMatch) {
    currentPhase = 'Starting Import';
    progress = 'Beginning database creation';
  } else if (extractMatch) {
    currentPhase = 'Extracting Data';
    progress = 'Decompressing OSM data';
  } else if (downloadMatch) {
    currentPhase = 'Downloading Data';
    progress = `Downloading ${downloadMatch[1]}`;
  }
  
  // Display the current phase and progress
  console.log(`${colors.bright}Current Phase: ${colors.yellow}${currentPhase}${colors.reset}`);
  console.log(`${colors.bright}Progress: ${colors.green}${progress}${colors.reset}\n`);
  
  // Display the estimated time remaining (if we can determine it)
  if (currentPhase === 'Ready') {
    console.log(`${colors.green}${colors.bright}✓ Import complete! The Overpass API is ready to use.${colors.reset}`);
  } else {
    // Find the most recent timestamp in the logs
    const timeRegex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
    let lastTimestamp;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(timeRegex);
      if (match) {
        lastTimestamp = match[0];
        break;
      }
    }
    
    if (lastTimestamp) {
      console.log(`${colors.bright}Last Activity: ${colors.cyan}${lastTimestamp}${colors.reset}`);
    }
    
    // Provide phase-specific information
    switch (currentPhase) {
      case 'Downloading Data':
        console.log(`${colors.yellow}The download phase can take from minutes to hours depending on your internet connection and the dataset size.${colors.reset}`);
        break;
      case 'Extracting Data':
        console.log(`${colors.yellow}The extraction phase typically takes 10-30 minutes for country-sized datasets and 1-2 hours for continent-sized datasets.${colors.reset}`);
        break;
      case 'Importing Nodes':
        console.log(`${colors.yellow}The node import phase is the longest part of the process. For Europe, this can take 12-24 hours.${colors.reset}`);
        break;
      case 'Importing Ways':
        console.log(`${colors.yellow}The way import phase typically takes 2-6 hours for Europe.${colors.reset}`);
        break;
      case 'Importing Relations':
        console.log(`${colors.yellow}The relation import phase is the final phase and typically takes 1-2 hours for Europe.${colors.reset}`);
        break;
      default:
        console.log(`${colors.yellow}The import process is ongoing. For large datasets like Europe, the total process can take 24-48 hours.${colors.reset}`);
    }
    
    console.log(`\n${colors.dim}To see the live logs, run: ${colors.reset}docker logs -f overpass-api`);
  }
  
  // Display the most recent log lines
  console.log(`\n${colors.bright}Recent Log Entries:${colors.reset}`);
  const recentLines = lines.slice(-10).filter(line => line.trim() !== '');
  recentLines.forEach(line => {
    console.log(`${colors.dim}${line}${colors.reset}`);
  });
  
  // Provide next steps
  console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
  if (currentPhase === 'Ready') {
    console.log(`${colors.green}1. Test the API with: ${colors.reset}node check-overpass.js`);
    console.log(`${colors.green}2. Your application is already configured to use the local Overpass API.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}1. The import is still in progress. Check again later with: ${colors.reset}node check-import-progress.js`);
    console.log(`${colors.yellow}2. For live updates, use: ${colors.reset}docker logs -f overpass-api`);
  }
  
} catch (error) {
  console.log(`${colors.red}${colors.bright}Error analyzing logs: ${error.message}${colors.reset}`);
  process.exit(1);
} 