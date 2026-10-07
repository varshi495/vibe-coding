process.env.NODE_ENV = 'test';
import app, { httpServer } from '../server';
import { prisma } from '../config/db';

const runGroupTests = async () => {
  console.log('\n🚀 Starting Group Conversations & Member Management Test Suite...\n');

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const address = httpServer.address() as any;
  const port = address.port;
  const baseUrl = `http://localhost:${port}/api`;

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
    const testEmails = [
      'group_alice@example.com',
      'group_bob@example.com',
      'group_charlie@example.com',
    ];

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

    // 2. Register Alice, Bob, Charlie
    const registerUser = async (name: string, email: string) => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier: email, password: 'password123' }),
      });
      const data = (await res.json()) as any;
      return { token: data.token, user: data.user };
    };

    const alice = await registerUser('Alice Admin', 'group_alice@example.com');
    const bob = await registerUser('Bob Member', 'group_bob@example.com');
    const charlie = await registerUser('Charlie Member', 'group_charlie@example.com');

    assert(!!alice.token && !!bob.token && !!charlie.token, 'Test users registered successfully');

    let groupId = '';

    // Test 1: POST /api/conversations/group creates group, creator gets ADMIN role
    const createGroupRes = await fetch(`${baseUrl}/conversations/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({
        name: 'Tech Squad',
        description: 'Engineering discussions',
        memberIds: [bob.user.id],
      }),
    });
    const createGroupData = (await createGroupRes.json()) as any;
    groupId = createGroupData.id;

    const aliceMember = createGroupData.members?.find((m: any) => m.userId === alice.user.id);
    const bobMember = createGroupData.members?.find((m: any) => m.userId === bob.user.id);

    assert(
      createGroupRes.status === 201 &&
        createGroupData.isGroup === true &&
        aliceMember?.role === 'ADMIN' &&
        bobMember?.role === 'MEMBER',
      '1. POST /api/conversations/group creates group and sets creator as ADMIN'
    );

    // Test 2: GET /api/conversations/:id returns group info + member list
    const getGroupRes = await fetch(`${baseUrl}/conversations/${groupId}`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const getGroupData = (await getGroupRes.json()) as any;

    assert(
      getGroupRes.status === 200 &&
        getGroupData.name === 'Tech Squad' &&
        getGroupData.members?.length === 2 &&
        getGroupData.groupInfo?.memberCount === 2,
      '2. GET /api/conversations/:id returns group info + member list'
    );

    // Test 3: POST /api/conversations/:id/members adds member (admin requester)
    const addMemberRes = await fetch(`${baseUrl}/conversations/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: charlie.user.id }),
    });
    const addMemberData = (await addMemberRes.json()) as any;

    assert(
      addMemberRes.status === 200 &&
        addMemberData.members?.length === 3 &&
        addMemberData.members.some((m: any) => m.userId === charlie.user.id),
      '3. POST /api/conversations/:id/members adds member by ADMIN'
    );

    // Test 4: POST /api/conversations/:id/members returns 403 for non-admin
    const nonAdminAddRes = await fetch(`${baseUrl}/conversations/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bob.token}`,
      },
      body: JSON.stringify({ userId: charlie.user.id }),
    });

    assert(
      nonAdminAddRes.status === 403,
      '4. POST /api/conversations/:id/members returns 403 for non-admin requester'
    );

    // Test 5: POST /api/conversations/:id/members returns 409 if user already member
    const duplicateAddRes = await fetch(`${baseUrl}/conversations/${groupId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ userId: charlie.user.id }),
    });

    assert(
      duplicateAddRes.status === 409,
      '5. POST /api/conversations/:id/members returns 409 if user already member'
    );

    // Test 6: DELETE /api/conversations/:id/members/:userId (self-leave) removes the member
    const leaveRes = await fetch(`${baseUrl}/conversations/${groupId}/members/${charlie.user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${charlie.token}` },
    });
    const leaveData = (await leaveRes.json()) as any;

    assert(
      leaveRes.status === 200 &&
        leaveData.ok === true &&
        !leaveData.members.some((m: any) => m.userId === charlie.user.id),
      '6. DELETE /api/conversations/:id/members/:userId allows member self-leave'
    );

    // Test 7: PUT /api/conversations/:id/members/:userId/role promotes member to ADMIN
    const promoteRes = await fetch(`${baseUrl}/conversations/${groupId}/members/${bob.user.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    const promoteData = (await promoteRes.json()) as any;
    const promotedBob = promoteData.members?.find((m: any) => m.userId === bob.user.id);

    assert(
      promoteRes.status === 200 && promotedBob?.role === 'ADMIN',
      '7. PUT /api/conversations/:id/members/:userId/role promotes member to ADMIN'
    );

    // Test 8: PUT /api/conversations/:id/info updates group name (admin only)
    const updateInfoRes = await fetch(`${baseUrl}/conversations/${groupId}/info`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alice.token}`,
      },
      body: JSON.stringify({ name: 'Tech Leaders' }),
    });
    const updateInfoData = (await updateInfoRes.json()) as any;

    assert(
      updateInfoRes.status === 200 && updateInfoData.conversation?.name === 'Tech Leaders',
      '8. PUT /api/conversations/:id/info updates group name (admin only)'
    );

    // Test 9: SYSTEM messages are persisted for group actions
    const messagesRes = await fetch(`${baseUrl}/conversations/${groupId}/messages`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const messagesData = (await messagesRes.json()) as any;
    const systemMessages = messagesData.filter((m: any) => m.type === 'SYSTEM');

    assert(
      messagesRes.status === 200 && systemMessages.length >= 1,
      '9. SYSTEM messages are persisted and returned for group actions'
    );

    // Test getConversations includes groupInfo
    const convListRes = await fetch(`${baseUrl}/conversations`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    const convListData = (await convListRes.json()) as any;
    const groupInList = convListData.find((c: any) => c.id === groupId);

    assert(
      groupInList?.isGroup === true && groupInList?.groupInfo?.name === 'Tech Leaders',
      'Bonus: GET /api/conversations returns groupInfo for group conversations'
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

runGroupTests();
