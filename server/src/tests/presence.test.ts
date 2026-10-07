process.env.NODE_ENV = 'test';
import { io as ioClient, Socket } from 'socket.io-client';
import app, { httpServer } from '../server';
import prisma from '../config/db';

const runPresenceTests = async () => {
  console.log('\n🚀 Starting Presence, Typing & Receipt Integration Test Suite...\n');

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
          { email: 'presence_alice@example.com' },
          { email: 'presence_bob@example.com' },
        ],
      },
    });

    // 2. Register Alice and Bob
    const aliceRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Presence', identifier: 'presence_alice@example.com', password: 'password123' }),
    });
    const aliceData = (await aliceRes.json()) as any;
    const aliceToken = aliceData.token;
    const aliceId = aliceData.user.id;

    const bobRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Presence', identifier: 'presence_bob@example.com', password: 'password123' }),
    });
    const bobData = (await bobRes.json()) as any;
    const bobToken = bobData.token;
    const bobId = bobData.user.id;

    assert(!!aliceToken && !!bobToken, 'Test user registration successful');

    // 3. Connect Alice Socket
    let socketAlice: Socket;
    let aliceOnlineEventReceived = false;

    await new Promise<void>((resolve, reject) => {
      socketAlice = ioClient(socketUrl, {
        auth: { token: aliceToken },
        transports: ['websocket'],
      });
      socketAlice.on('connect', () => resolve());
      socketAlice.on('connect_error', (err) => reject(err));
    });

    // Connect Bob Socket and listen for presence events
    let socketBob: Socket;
    let presenceEventReceived = false;
    let presenceData: any = null;

    await new Promise<void>((resolve, reject) => {
      socketBob = ioClient(socketUrl, {
        auth: { token: bobToken },
        transports: ['websocket'],
      });
      socketBob.on('user_presence', (data: any) => {
        presenceEventReceived = true;
        presenceData = data;
      });
      socketBob.on('connect', () => resolve());
      socketBob.on('connect_error', (err) => reject(err));
    });

    assert(socketAlice!.connected && socketBob!.connected, 'Both Alice and Bob sockets connected');

    // Check presence REST endpoint
    const presenceRes = await fetch(`${baseUrl}/users/presence?ids=${aliceId},${bobId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    const presenceList = (await presenceRes.json()) as any;
    assert(presenceRes.status === 200, 'GET /api/users/presence returns 200');
    assert(
      Array.isArray(presenceList) &&
        presenceList.some((p: any) => p.id === bobId && p.isOnline === true),
      'Presence endpoint reports Bob as online'
    );

    // 4. Test Typing Broadcaster
    let typingReceived = false;
    let typingData: any = null;

    const typingPromise = new Promise<void>((resolve) => {
      socketBob.on('user_typing', (data: any) => {
        typingReceived = true;
        typingData = data;
        resolve();
      });

      socketAlice.emit('typing_start', {
        conversationId: 'conv-test-123',
        recipientId: bobId,
      });
    });

    await typingPromise;
    assert(typingReceived && typingData.isTyping === true && typingData.userId === aliceId, 'Bob receives typing_start from Alice');

    // 5. Test Message Delivery Receipt (mark_delivered)
    // Create conversation between Alice and Bob
    const convRes = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceToken}`,
      },
      body: JSON.stringify({ recipientId: bobId }),
    });
    const convData = (await convRes.json()) as any;
    const conversationId = convData.id;

    // Alice sends a message
    let testMessageId = '';
    const sendPromise = new Promise<void>((resolve) => {
      socketAlice.on('message_ack', (data: any) => {
        testMessageId = data.message.id;
        resolve();
      });
      socketAlice.emit('send_message', {
        tempId: 'temp-p-1',
        conversationId,
        recipientId: bobId,
        content: 'Checkmark test message',
      });
    });
    await sendPromise;

    // Bob marks message as delivered
    let deliveredStatusReceived = false;
    const deliveryPromise = new Promise<void>((resolve) => {
      socketAlice.on('message_status_update', (data: any) => {
        if (data.status === 'DELIVERED') {
          deliveredStatusReceived = true;
          resolve();
        }
      });
      socketBob.emit('mark_delivered', {
        messageId: testMessageId,
        conversationId,
        senderId: aliceId,
      });
    });
    await deliveryPromise;
    assert(deliveredStatusReceived, 'Alice receives message_status_update DELIVERED');

    // 6. Test Message Read Receipt (mark_read)
    let readStatusReceived = false;
    const readPromise = new Promise<void>((resolve) => {
      socketAlice.on('message_status_update', (data: any) => {
        if (data.status === 'READ') {
          readStatusReceived = true;
          resolve();
        }
      });
      socketBob.emit('mark_read', {
        conversationId,
        senderId: aliceId,
      });
    });
    await readPromise;
    assert(readStatusReceived, 'Alice receives message_status_update READ');

    // Verify DB status is READ
    const dbMsg = await prisma.message.findUnique({ where: { id: testMessageId } });
    assert(dbMsg?.status === 'READ', 'Database message status updated to READ');

    // 7. Test Disconnect Presence & lastSeen Update
    let disconnectPresenceReceived = false;
    const disconnectPromise = new Promise<void>((resolve) => {
      socketBob.on('user_presence', (data: any) => {
        if (data.userId === aliceId && data.isOnline === false) {
          disconnectPresenceReceived = true;
          resolve();
        }
      });
      socketAlice.disconnect();
    });
    await disconnectPromise;
    assert(disconnectPresenceReceived, 'Bob receives user_presence offline event when Alice disconnects');

    // Clean up
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

runPresenceTests().catch((err) => {
  console.error('Fatal presence test error:', err);
  process.exit(1);
});
