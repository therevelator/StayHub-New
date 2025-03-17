/**
 * Script to update the application to use a local Overpass API
 * 
 * This script modifies the Planning.jsx file to prioritize the local Overpass API
 * endpoint while keeping the remote endpoints as fallbacks.
 */

const fs = require('fs');
const path = require('path');

// Path to the Planning.jsx file
const planningFilePath = path.join(__dirname, 'client', 'src', 'pages', 'Planning', 'Planning.jsx');

// Read the file
let content = fs.readFileSync(planningFilePath, 'utf8');

// Find the OVERPASS_ENDPOINTS array
const endpointsRegex = /const OVERPASS_ENDPOINTS = \[([\s\S]*?)\];/;
const match = content.match(endpointsRegex);

if (match) {
  // Current endpoints
  const currentEndpoints = match[1];
  
  // Create new endpoints array with local endpoint first
  const newEndpoints = `
    'http://localhost:8080/api/interpreter', // Local instance
    ${currentEndpoints.trim()}
  `;
  
  // Replace the endpoints in the file
  const updatedContent = content.replace(endpointsRegex, `const OVERPASS_ENDPOINTS = [${newEndpoints}];`);
  
  // Write the updated content back to the file
  fs.writeFileSync(planningFilePath, updatedContent, 'utf8');
  
  console.log('Successfully updated Planning.jsx to use local Overpass API');
  console.log('Local endpoint added: http://localhost:8080/api/interpreter');
} else {
  console.error('Could not find OVERPASS_ENDPOINTS array in Planning.jsx');
}

// Update the timeout for local development (optional)
const timeoutRegex = /timeout: (\d+),/;
if (content.match(timeoutRegex)) {
  const updatedContent = content.replace(
    timeoutRegex, 
    'timeout: 30000, // Increased timeout for local development'
  );
  fs.writeFileSync(planningFilePath, updatedContent, 'utf8');
  console.log('Increased request timeout for better development experience');
}

console.log('\nNext steps:');
console.log('1. Start your local Overpass API server');
console.log('2. Run your application');
console.log('3. Test POI search functionality');
console.log('\nIf you encounter issues, check the browser console for errors');
console.log('and ensure your local Overpass API server is running correctly.'); 