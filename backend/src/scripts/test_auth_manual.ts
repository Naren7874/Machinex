
// Usage: npx ts-node internal_test_auth.ts

async function testAuth() {
    const API_URL = 'http://localhost:3000/api/auth';
    const TEST_PHONE = '+919999999999';

    console.log('🚀 Starting Auth Flow Test...\n');

    // 1. REGISTER
    console.log('1️⃣  Registering User...');
    try {
        const regRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: TEST_PHONE,
                name: 'Test User',
                email: 'test@example.com'
            })
        });
        const regData = await regRes.json();
        console.log('   Response:', regData);
    } catch (e) {
        console.log('   Note: User might already exist, proceeding to login...');
    }

    // 2. LOGIN (To get OTP)
    console.log('\n2️⃣  Logging in (to trigger OTP)...');
    const loginRes = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_PHONE })
    });
    const loginData = await loginRes.json();
    console.log('   Response:', loginData);

    // IN A REAL APP, WE WOULD WAIT FOR SMS.
    // BUT since we don't have the console logs here, we need to cheat.
    // I will tell the user to look at their terminal for the OTP.

    console.log('\n⚠️  ACTION REQUIRED: Look at your BACKEND TERMINAL.');
    console.log('   You should see a log like: "Login OTP sent to ******: 123456"');
    console.log('   Wait for the server logs to appear...');
}

testAuth();
