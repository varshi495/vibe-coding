import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// GET /api/conversations — list user conversations with last message + unread count
export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, avatar: true, status: true, lastSeen: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: { updatedAt: "desc" },
      },
    });

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conv = membership.conversation;

        // Unread count: messages after my lastReadAt from others
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: membership.lastReadAt },
          },
        });

        // For 1-on-1, find the other member
        const otherMember = conv.members.find((m) => m.userId !== userId);

        return {
          id: conv.id,
          isGroup: conv.isGroup,
          updatedAt: conv.updatedAt,
          otherMember: otherMember?.user ?? null,
          lastMessage: conv.messages[0] ?? null,
          unreadCount,
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error("[conversationController] getConversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// POST /api/conversations — get or create 1-on-1 conversation
export const getOrCreateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { recipientId } = req.body as { recipientId?: string };

  if (!recipientId || recipientId === userId) {
    res.status(400).json({ error: "Valid recipientId required" });
    return;
  }

  try {
    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, avatar: true, status: true },
    });
    if (!recipient) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Find existing 1-on-1 conversation between the two users
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        members: {
          every: {
            userId: { in: [userId, recipientId] },
          },
        },
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, status: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existing) {
      const otherMember = existing.members.find((m) => m.userId !== userId);
      res.json({
        id: existing.id,
        isGroup: existing.isGroup,
        updatedAt: existing.updatedAt,
        otherMember: otherMember?.user ?? null,
        lastMessage: existing.messages[0] ?? null,
        unreadCount: 0,
      });
      return;
    }

    // Create new conversation + both members
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, status: true } },
          },
        },
      },
    });

    const otherMember = conversation.members.find((m) => m.userId !== userId);
    res.status(201).json({
      id: conversation.id,
      isGroup: conversation.isGroup,
      updatedAt: conversation.updatedAt,
      otherMember: otherMember?.user ?? null,
      lastMessage: null,
      unreadCount: 0,
    });
  } catch (err) {
    console.error("[conversationController] getOrCreateConversation error:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
};

// GET /api/conversations/:id/messages — paginated message history
export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id: conversationId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;

  try {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) {
      res.status(403).json({ error: "Not a member of this conversation" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update lastReadAt
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    // Return in chronological order (oldest first for display)
    res.json(messages.reverse());
  } catch (err) {
    console.error("[conversationController] getMessages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// PUT /api/conversations/:id/read — mark all messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id: conversationId } = req.params;

  try {
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[conversationController] markAsRead error:", err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};
