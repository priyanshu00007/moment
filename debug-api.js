// debug-api.js
const axios = require('axios');

async function debugAPI() {
  console.log('🔍 DEBUGGING API CONNECTION');
  console.log('================================');
  
  const baseURL = 'http://localhost:5000';
  const apiURL = 'http://localhost:5000/api/v1';
  
  console.log('🔗 URLs to test:');
  console.log('   Backend Base:', baseURL);
  console.log('   API Base:', apiURL);
  console.log('');
  
  // Test 1: Backend root
  try {
    console.log('1️⃣ Testing backend root...');
    const response = await axios.get(baseURL, { timeout: 5000 });
    console.log('✅ Backend root OK:', response.status, response.statusText);
    console.log('   Data:', response.data);
  } catch (error) {
    console.error('❌ Backend root failed:', error.code, error.message);
  }
  
  console.log('');
  
  // Test 2: Health endpoint
  try {
    console.log('2️⃣ Testing health endpoint...');
    const response = await axios.get(`${baseURL}/health`, { timeout: 5000 });
    console.log('✅ Health endpoint OK:', response.status, response.statusText);
    console.log('   Data:', response.data);
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.code, error.message);
  }
  
  console.log('');
  
  // Test 3: Tasks endpoint
  try {
    console.log('3️⃣ Testing tasks endpoint...');
    const response = await axios.get(`${apiURL}/tasks`, { timeout: 5000 });
    console.log('✅ Tasks endpoint OK:', response.status, response.statusText);
    console.log('   Data preview:', {
      success: response.data?.success,
      count: response.data?.count,
      dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'Not array'
    });
  } catch (error) {
    console.error('❌ Tasks endpoint failed:', error.code, error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
  
  console.log('');
  console.log('================================');
  console.log('🔍 DEBUG COMPLETED');
}

debugAPI().catch(console.error);
