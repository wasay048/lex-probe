// Debug script to test API configuration
console.log('Environment variables:');
console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

// Test API call
const testAPI = async () => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    const apiUrl = `${API_BASE_URL}/api/v1/health`;
    
    console.log('Testing API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('API Response:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
};

// Test login API
const testLogin = async () => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    const apiUrl = `${API_BASE_URL}/api/v1/auth/login`;
    
    console.log('Testing login URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123'
      })
    });
    
    const data = await response.json();
    console.log('Login API Response:', response.status, data);
  } catch (error) {
    console.error('Login API Error:', error);
  }
};

if (typeof window !== 'undefined') {
  console.log('Running in browser');
  testAPI();
  testLogin();
} else {
  console.log('Running in Node.js');
}
