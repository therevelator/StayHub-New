/**
 * Script to check the status of the local Overpass API instance
 * 
 * Run with: node check-overpass.js
 */

const http = require('http');

const OVERPASS_URL = 'http://localhost:8080/api/interpreter';
const TEST_QUERY = '[out:json];node(47.5,9.5,47.6,9.6);out;';

console.log('Checking Overpass API status...');
console.log(`URL: ${OVERPASS_URL}`);
console.log(`Query: ${TEST_QUERY}`);
console.log('-----------------------------------');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
};

const req = http.request(OVERPASS_URL, options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✅ Overpass API is running and responding!');
  } else {
    console.log('❌ Overpass API returned an unexpected status code.');
  }
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(`Received ${result.elements.length} elements in the response.`);
      console.log('Sample data:');
      if (result.elements.length > 0) {
        console.log(JSON.stringify(result.elements[0], null, 2));
      } else {
        console.log('No elements found in the response.');
      }
    } catch (e) {
      console.log('Could not parse response as JSON. The server might still be initializing.');
      console.log('First 200 characters of response:');
      console.log(data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error connecting to Overpass API:');
  console.error(error.message);
  console.log('\nPossible reasons:');
  console.log('1. Docker is not running');
  console.log('2. The Overpass API container is not started');
  console.log('3. The container is still initializing (check docker logs)');
  console.log('\nTry running:');
  console.log('docker-compose -f docker-compose.overpass.yml up -d');
  console.log('docker logs -f overpass-api');
});

req.write(`data=${encodeURIComponent(TEST_QUERY)}`);
req.end(); 