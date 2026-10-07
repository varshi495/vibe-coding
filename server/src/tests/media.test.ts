process.env.NODE_ENV = 'test';
import app, { httpServer } from '../server';
import { prisma } from '../config/db';

const runMediaTests = async () => {
  console.log('\n🚀 Starting Media Sharing & File Attachments Integration Test Suite...\n');

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}/api`;
  const hostUrl = `http://localhost:${port}`;

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
    const testEmails = ['media_alice@example.com', 'media_bob@example.com'];
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });
    const userIds = existingUsers.map((u) => u.id);

    if (userIds.length > 0) {
      const convMembers = await prisma.conversationMember.findMany({
        where: { userId: { in: userIds } },
        select: { conversationId: true },
      });
      const convIds = Array.from(new Set(convMembers.map((cm) => cm.conversationId)));
      await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversationMember.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    // 2. Register Alice and Bob
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Media', identifier: 'media_alice@example.com', password: 'password123' }),
    });
    const alice = (await regRes.json()) as any;

    const bobRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Media', identifier: 'media_bob@example.com', password: 'password123' }),
    });
    const bob = (await bobRes.json()) as any;

    assert(!!alice.token && !!bob.token, 'Test users registered successfully');

    // Create a 1-on-1 conversation
    const convRes = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ recipientId: bob.user.id }),
    });
    const conversation = (await convRes.json()) as any;
    const conversationId = conversation.id;
    assert(!!conversationId, 'Conversation created between Alice and Bob');

    let uploadedImageUrl = '';
    let uploadedImageFileName = '';

    // Test 1: Image Upload (image/png)
    const imageFormData = new FormData();
    const imageBlob = new Blob(['fake_png_binary_data'], { type: 'image/png' });
    imageFormData.append('file', imageBlob, 'photo.png');

    const imageUploadRes = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}` },
      body: imageFormData,
    });
    const imageData = (await imageUploadRes.json()) as any;
    uploadedImageUrl = imageData.url;
    uploadedImageFileName = imageData.fileName;

    assert(
      imageUploadRes.status === 200 &&
        imageData.messageType === 'IMAGE' &&
        imageData.url.startsWith('/uploads/'),
      '1. POST /api/media/upload with PNG image returns 200, url, and messageType: IMAGE'
    );

    // Test 2: Audio Upload (audio/webm)
    const audioFormData = new FormData();
    const audioBlob = new Blob(['fake_audio_stream_data'], { type: 'audio/webm' });
    audioFormData.append('file', audioBlob, 'voicenote.webm');

    const audioUploadRes = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}` },
      body: audioFormData,
    });
    const audioData = (await audioUploadRes.json()) as any;

    assert(
      audioUploadRes.status === 200 &&
        audioData.messageType === 'AUDIO' &&
        audioData.url.startsWith('/uploads/'),
      '2. POST /api/media/upload with WebM audio returns 200, url, and messageType: AUDIO'
    );

    // Test 3: Document Upload (application/pdf)
    const docFormData = new FormData();
    const docBlob = new Blob(['fake_pdf_document_data'], { type: 'application/pdf' });
    docFormData.append('file', docBlob, 'specification.pdf');

    const docUploadRes = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}` },
      body: docFormData,
    });
    const docData = (await docUploadRes.json()) as any;

    assert(
      docUploadRes.status === 200 &&
        docData.messageType === 'DOCUMENT' &&
        docData.fileName === 'specification.pdf',
      '3. POST /api/media/upload with PDF returns 200 and messageType: DOCUMENT'
    );

    // Test 4: Video Upload (video/mp4)
    const videoFormData = new FormData();
    const videoBlob = new Blob(['fake_mp4_video_data'], { type: 'video/mp4' });
    videoFormData.append('file', videoBlob, 'demo.mp4');

    const videoUploadRes = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}` },
      body: videoFormData,
    });
    const videoData = (await videoUploadRes.json()) as any;

    assert(
      videoUploadRes.status === 200 &&
        videoData.messageType === 'VIDEO' &&
        videoData.url.startsWith('/uploads/'),
      '4. POST /api/media/upload with MP4 video returns 200 and messageType: VIDEO'
    );

    // Test 5: Rejects file exceeding 25MB
    const oversizedFormData = new FormData();
    // 26 MB buffer
    const oversizedBuffer = new Uint8Array(26 * 1024 * 1024);
    const oversizedBlob = new Blob([oversizedBuffer], { type: 'image/png' });
    oversizedFormData.append('file', oversizedBlob, 'huge.png');

    const oversizedRes = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}` },
      body: oversizedFormData,
    });

    assert(
      oversizedRes.status === 413 || oversizedRes.status === 400,
      '5. POST /api/media/upload rejects file exceeding 25MB'
    );

    // Test 6: Rejects disallowed MIME type
    const exeFormData = new FormData();
    const exeBlob = new Blob(['fake_executable'], { type: 'application/x-msdownload' });
    exeFormData.append('file', exeBlob, 'malware.exe');

    const exeRes = await fetch(`${baseUrl}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${alice.token}` },
      body: exeFormData,
    });

    assert(
      exeRes.status === 400,
      '6. POST /api/media/upload rejects disallowed MIME type with 400'
    );

    // Test 7: Static file serving (GET /uploads/:filename)
    const staticRes = await fetch(`${hostUrl}${uploadedImageUrl}`);
    const staticText = await staticRes.text();

    assert(
      staticRes.status === 200 && staticText === 'fake_png_binary_data',
      '7. GET /uploads/:filename serves uploaded static file content'
    );

    // Test 8: Send media message (POST /api/conversations/:id/messages/media)
    const sendMediaRes = await fetch(`${baseUrl}/conversations/${conversationId}/messages/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        mediaUrl: uploadedImageUrl,
        mediaType: 'image/png',
        fileName: uploadedImageFileName,
        fileSize: 1024,
        type: 'IMAGE',
        caption: 'Look at this design screenshot',
      }),
    });
    const mediaMessageData = (await sendMediaRes.json()) as any;

    assert(
      sendMediaRes.status === 201 &&
        mediaMessageData.type === 'IMAGE' &&
        mediaMessageData.mediaUrl === uploadedImageUrl &&
        mediaMessageData.content === 'Look at this design screenshot',
      '8. POST /api/conversations/:id/messages/media creates and returns media message'
    );

    // Test 9: Fetch conversation messages returns media message with metadata
    const getMsgsRes = await fetch(`${baseUrl}/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${bob.token}` },
    });
    const messages = (await getMsgsRes.json()) as any[];
    const lastMsg = messages[messages.length - 1];

    assert(
      getMsgsRes.status === 200 &&
        lastMsg?.type === 'IMAGE' &&
        lastMsg?.mediaUrl === uploadedImageUrl &&
        lastMsg?.fileName === uploadedImageFileName &&
        lastMsg?.fileSize === 1024,
      '9. GET /api/conversations/:id/messages includes mediaUrl, mediaType, fileName, and fileSize'
    );

  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runMediaTests();
