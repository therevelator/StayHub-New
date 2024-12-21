import axios from 'axios';

async function checkServer() {
  try {
    console.log('Checking server status...');
    
    const response = await axios.get('http://localhost:5001/api/health');
    console.log('Server response:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Server is not running on port 5001');
    } else {
      console.error('Error checking server:', error.message);
    }
  }
}

checkServer();
