process.env.NODE_ENV = 'test';
import http from 'http';
import { io as ioClient, Socket } from 'socket.io-client';
import app, { httpServer } from '../server';
import prisma from '../config/db';

const runChatTests = async () => {
  console.log('\n🚀 Starting Chat & Real-Time Socket Integration Test Suite...\n');

  // Listen on a random free port for HTTP & Sockets
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}/api`;
  const socketUrl = `http://localhost:${port}`;

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
    // 1. Clean up old test data
    await prisma.message.deleteMany({});
    await prisma.conversationMember.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'chat_alice@example.com' },
          { email: 'chat_bob@example.com' },
        ],
      },
    });

    // 2. Register Alice and Bob
    const aliceRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Chat', identifier: 'chat_alice@example.com', password: 'password123' }),
    });
    const aliceData = (await aliceRes.json()) as any;
    const aliceToken = aliceData.token;
    const aliceId = aliceData.user.id;

    const bobRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Chat', identifier: 'chat_bob@example.com', password: 'password123' }),
    });
    const bobData = (await bobRes.json()) as any;
    const bobToken = bobData.token;
    const bobId = bobData.user.id;

    assert(!!aliceToken && !!bobToken, 'Test user registration successful');

    // 3. User search endpoint test
    const searchRes = await fetch(`${baseUrl}/users/search?q=Bob`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const searchData = (await searchRes.json()) as any;
    assert(searchRes.status === 200, 'GET /api/users/search returns 200');
    const foundBob = searchData.find((u: any) => u.id === bobId);
    assert(!!foundBob, 'Search returns Bob Chat profile');

    // 4. Create conversation
    const createConvRes = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ recipientId: bobId }),
    });
    const convData = (await createConvRes.json()) as any;
    assert(createConvRes.status === 200 || createConvRes.status === 201, 'POST /api/conversations returns 200/201');
    assert(!!convData.id, 'Returns conversation object with id');
    const conversationId = convData.id;

    // Idempotency check: creating conversation again with same recipient returns same conversation ID
    const reCreateRes = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ recipientId: bobId }),
    });
    const reConvData = (await reCreateRes.json()) as any;
    assert(reConvData.id === conversationId, 'POST /api/conversations is idempotent (returns existing conversation)');

    // 5. GET /api/conversations
    const getConvsRes = await fetch(`${baseUrl}/conversations`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const getConvsData = (await getConvsRes.json()) as any;
    assert(getConvsRes.status === 200, 'GET /api/conversations returns 200');
    assert(Array.isArray(getConvsData) && getConvsData.length === 1, 'Returns 1 conversation for Alice');
    assert(getConvsData[0].otherMember.id === bobId, 'Conversation contains Bob as otherMember');

    // 6. Socket.IO authentication test
    let socketAlice: Socket;
    let socketBob: Socket;

    await new Promise<void>((resolve, reject) => {
      socketAlice = ioClient(socketUrl, {
        auth: { token: aliceToken },
        transports: ['websocket'],
      });
      socketAlice.on('connect', () => resolve());
      socketAlice.on('connect_error', (err) => reject(err));
    });
    assert(socketAlice!.connected, 'Socket.IO connects successfully with valid Alice token');

    await new Promise<void>((resolve, reject) => {
      socketBob = ioClient(socketUrl, {
        auth: { token: bobToken },
        transports: ['websocket'],
      });
      socketBob.on('connect', () => resolve());
      socketBob.on('connect_error', (err) => reject(err));
    });
    assert(socketBob!.connected, 'Socket.IO connects successfully with valid Bob token');

    // Test rejection with invalid token
    let rejectSuccess = false;
    await new Promise<void>((resolve) => {
      const badSocket = ioClient(socketUrl, {
        auth: { token: 'invalid_token_xyz' },
        transports: ['websocket'],
      });
      badSocket.on('connect_error', () => {
        rejectSuccess = true;
        badSocket.disconnect();
        resolve();
      });
    });
    assert(rejectSuccess, 'Socket.IO rejects connection with invalid token');

    // 7. Test real-time message sending & receiving
    const testTempId = 'temp-msg-123';
    const testContent = 'Hello Bob! This is real-time messaging!';

    let aliceAckReceived = false;
    let bobMessageReceived = false;
    let confirmedMessageId = '';

    const sendPromise = new Promise<void>((resolve) => {
      socketAlice.on('message_ack', (data: any) => {
        if (data.tempId === testTempId) {
          aliceAckReceived = true;
          confirmedMessageId = data.message.id;
          if (bobMessageReceived) resolve();
        }
      });

      socketBob.on('receive_message', (data: any) => {
        if (data.message.content === testContent) {
          bobMessageReceived = true;
          if (aliceAckReceived) resolve();
        }
      });

      socketAlice.emit('send_message', {
        tempId: testTempId,
        conversationId,
        recipientId: bobId,
        content: testContent,
      });
    });

    await sendPromise;

    assert(aliceAckReceived, 'Alice receives message_ack with matching tempId');
    assert(bobMessageReceived, 'Bob receives real-time receive_message event');

    // 8. Test GET /api/conversations/:id/messages
    const getMsgsRes = await fetch(`${baseUrl}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    const getMsgsData = (await getMsgsRes.json()) as any;
    assert(getMsgsRes.status === 200, 'GET /api/conversations/:id/messages returns 200');
    assert(Array.isArray(getMsgsData) && getMsgsData.length === 1, 'Returns 1 message in conversation history');
    assert(getMsgsData[0].content === testContent, 'Persisted message content matches');
    assert(getMsgsData[0].id === confirmedMessageId, 'Persisted message id matches ack id');

    // Clean up sockets
    socketAlice.disconnect();
    socketBob.disconnect();

    console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    httpServer.close();
    await prisma.$disconnect();
  }
};

runChatTests().catch((err) => {
  console.error('Fatal chat test error:', err);
  process.exit(1);
});
