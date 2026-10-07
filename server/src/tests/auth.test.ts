process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../server';
import prisma from '../config/db';

const runTests = async () => {
  console.log('\n🚀 Starting Auth Integration Test Suite...\n');

  // Start server on random free port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}/api/auth`;

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, details?: string) => {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ ${testName} FAILED ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test_alice@example.com' },
          { phone: '+1234567890' },
          { email: 'test_bob@example.com' },
        ],
      },
    });

    // Test 1: Register with Email
    const regRes1 = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Tester',
        identifier: 'test_alice@example.com',
        password: 'password123',
      }),
    });
    const regData1 = await regRes1.json() as any;
    assert(regRes1.status === 201, 'AUTH-01: Register with Email returns 201');
    assert(typeof regData1.token === 'string' && regData1.token.length > 20, 'AUTH-02: Returns valid JWT token');
    assert(regData1.user.email === 'test_alice@example.com', 'Returns user email in profile');
    assert(!regData1.user.password, 'AUTH-06: Response does not leak password hash');

    // Test 2: Register with Phone
    const regRes2 = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Mobile',
        identifier: '+1234567890',
        password: 'securephonepass',
      }),
    });
    const regData2 = await regRes2.json() as any;
    assert(regRes2.status === 201, 'AUTH-01: Register with Phone returns 201');
    assert(regData2.user.phone === '+1234567890', 'Returns normalized phone in profile');

    // Test 3: Short password validation
    const shortPassRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Shorty',
        identifier: 'short@example.com',
        password: '123',
      }),
    });
    assert(shortPassRes.status === 400, 'AUTH-06: Rejects password shorter than 6 chars with 400');

    // Test 4: Duplicate registration rejection
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Clone',
        identifier: 'test_alice@example.com',
        password: 'password123',
      }),
    });
    assert(dupRes.status === 409, 'Rejects duplicate email with 409 Conflict');

    // Test 5: Login with Email & valid password
    const loginRes1 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_alice@example.com',
        password: 'password123',
      }),
    });
    const loginData1 = await loginRes1.json() as any;
    assert(loginRes1.status === 200, 'AUTH-02: Login with Email returns 200');
    assert(typeof loginData1.token === 'string', 'Login returns fresh JWT token');

    // Test 6: Login with Phone & valid password
    const loginRes2 = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '+1234567890',
        password: 'securephonepass',
      }),
    });
    assert(loginRes2.status === 200, 'AUTH-02: Login with Phone number returns 200');

    // Test 7: Login with wrong password
    const wrongPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'test_alice@example.com',
        password: 'wrong_password',
      }),
    });
    assert(wrongPassRes.status === 401, 'AUTH-06: Login with invalid password returns 401 Unauthorized');

    // Test 8: GET /me with Bearer token
    const token = loginData1.token;
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json() as any;
    assert(meRes.status === 200, 'AUTH-05: GET /me with Bearer token returns 200');
    assert(meData.user.name === 'Alice Tester', 'Session user matches Alice Tester');

    // Test 9: GET /me without token
    const noTokenRes = await fetch(`${baseUrl}/me`);
    assert(noTokenRes.status === 401, 'GET /me without token returns 401 Unauthorized');

    // Test 10: PUT /profile update status bio and name
    const updateRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Alice Verified',
        status: 'Available and ready to vibe code!',
      }),
    });
    const updateData = await updateRes.json() as any;
    assert(updateRes.status === 200, 'AUTH-04: Update profile returns 200');
    assert(updateData.user.name === 'Alice Verified', 'Updated name persisted');
    assert(updateData.user.status === 'Available and ready to vibe code!', 'Updated status bio persisted');

    // Verify DB password hash directly
    const dbUser = await prisma.user.findUnique({
      where: { email: 'test_alice@example.com' },
    });
    assert(
      !!dbUser && (dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$')),
      'Database password uses valid bcrypt hash'
    );

    console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
    await prisma.$disconnect();
  }
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
