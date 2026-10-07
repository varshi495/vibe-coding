import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { getIO } from "../sockets/socketManager";

// POST /api/conversations/group — create a new group conversation
export const createGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { name, memberIds, description, avatar } = req.body as {
    name?: string;
    memberIds?: string[];
    description?: string;
    avatar?: string;
  };

  if (!name || !name.trim()) {
    res.status(400).json({ error: "Group name is required" });
    return;
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    res.status(400).json({ error: "At least one member must be selected" });
    return;
  }

  // Filter out creator id if in memberIds to avoid duplicate key error
  const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== userId)));
  if (uniqueMemberIds.length === 0) {
    res.status(400).json({ error: "At least one other member is required" });
    return;
  }

  try {
    // Verify all member IDs exist in User table
    const usersCount = await prisma.user.count({
      where: { id: { in: uniqueMemberIds } },
    });
    if (usersCount !== uniqueMemberIds.length) {
      res.status(400).json({ error: "One or more selected users do not exist" });
      return;
    }

    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true },
    });

    // Create Conversation with creator as ADMIN and others as MEMBER
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        name: name.trim(),
        description: description?.trim() || null,
        avatar: avatar || null,
        createdBy: userId,
        members: {
          create: [
            { userId, role: "ADMIN" },
            ...uniqueMemberIds.map((id) => ({ userId: id, role: "MEMBER" as const })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, status: true, lastSeen: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    // Create SYSTEM message: "Alice created group 'Design Team'"
    const systemMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: `${creator?.name || "Someone"} created group "${name.trim()}"`,
        type: "SYSTEM",
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Format response payload
    const payload = {
      id: conversation.id,
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar,
      isGroup: true,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      members: conversation.members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
        status: m.user.status,
        lastSeen: m.user.lastSeen,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      lastMessage: systemMessage,
      unreadCount: 0,
      groupInfo: {
        name: conversation.name,
        description: conversation.description,
        avatar: conversation.avatar,
        memberCount: conversation.members.length,
      },
    };

    // Emit group_created to all members so their chat lists update
    try {
      const io = getIO();
      for (const m of conversation.members) {
        io.to(m.userId).emit("group_created", { conversation: payload });
      }
    } catch {
      // Socket not ready or running in test without socket server
    }

    res.status(201).json(payload);
  } catch (err) {
    console.error("[groupController] createGroup error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
};

// GET /api/conversations/:id — get group details and members
export const getGroupInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    if (!membership) {
      res.status(403).json({ error: "Not a member of this conversation" });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true, status: true, lastSeen: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({
      id: conversation.id,
      name: conversation.name,
      description: conversation.description,
      avatar: conversation.avatar,
      isGroup: conversation.isGroup,
      createdBy: conversation.createdBy,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      members: conversation.members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
        status: m.user.status,
        lastSeen: m.user.lastSeen,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      lastMessage: conversation.messages[0] ?? null,
      groupInfo: conversation.isGroup
        ? {
            name: conversation.name,
            description: conversation.description,
            avatar: conversation.avatar,
            memberCount: conversation.members.length,
          }
        : null,
    });
  } catch (err) {
    console.error("[groupController] getGroupInfo error:", err);
    res.status(500).json({ error: "Failed to get group info" });
  }
};

// POST /api/conversations/:id/members — add member (admin only)
export const addMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;
  const { userId: targetUserId } = req.body as { userId?: string };

  if (!targetUserId) {
    res.status(400).json({ error: "target userId is required" });
    return;
  }

  try {
    const requester = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
      include: { user: { select: { name: true } } },
    });
    if (!requester) {
      res.status(403).json({ error: "Not a member of this conversation" });
      return;
    }
    if (requester.role !== "ADMIN") {
      res.status(403).json({ error: "Admin privileges required" });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, avatar: true },
    });
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existing = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
    });
    if (existing) {
      res.status(409).json({ error: "User is already a member of this group" });
      return;
    }

    await prisma.conversationMember.create({
      data: {
        conversationId: id,
        userId: targetUserId,
        role: "MEMBER",
      },
    });

    const systemMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content: `${requester.user.name} added ${targetUser.name}`,
        type: "SYSTEM",
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const members = await prisma.conversationMember.findMany({
      where: { conversationId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true, status: true, lastSeen: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const formattedMembers = members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      avatar: m.user.avatar,
      status: m.user.status,
      lastSeen: m.user.lastSeen,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    try {
      const io = getIO();
      io.to(`conv:${id}`).emit("group_member_update", {
        conversationId: id,
        members: formattedMembers,
      });
      io.to(`conv:${id}`).emit("receive_message", {
        message: systemMessage,
        conversationId: id,
      });
      io.to(targetUserId).emit("group_created", { conversationId: id });
    } catch {}

    res.json({ members: formattedMembers, systemMessage });
  } catch (err) {
    console.error("[groupController] addMember error:", err);
    res.status(500).json({ error: "Failed to add member" });
  }
};

// DELETE /api/conversations/:id/members/:userId — remove member or leave group
export const removeMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const requesterId = req.userId!;
  const { id, userId: targetUserId } = req.params;

  try {
    const targetMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
      include: { user: { select: { name: true } } },
    });
    if (!targetMember) {
      res.status(404).json({ error: "User is not a member of this group" });
      return;
    }

    const requesterMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: requesterId } },
      include: { user: { select: { name: true } } },
    });
    if (!requesterMember) {
      res.status(403).json({ error: "Not a member of this conversation" });
      return;
    }

    // Removing someone else requires ADMIN role
    if (targetUserId !== requesterId && requesterMember.role !== "ADMIN") {
      res.status(403).json({ error: "Admin privileges required to remove members" });
      return;
    }

    // Delete membership
    await prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
    });

    // Check remaining members
    const remainingMembers = await prisma.conversationMember.findMany({
      where: { conversationId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true, status: true, lastSeen: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    // If removed member was admin and no admins remain, promote oldest member to ADMIN
    const hasAdmin = remainingMembers.some((m) => m.role === "ADMIN");
    if (!hasAdmin && remainingMembers.length > 0) {
      await prisma.conversationMember.update({
        where: { id: remainingMembers[0].id },
        data: { role: "ADMIN" },
      });
      remainingMembers[0].role = "ADMIN";
    }

    // System message
    const content =
      targetUserId === requesterId
        ? `${targetMember.user.name} left the group`
        : `${requesterMember.user.name} removed ${targetMember.user.name}`;

    const systemMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: requesterId,
        content,
        type: "SYSTEM",
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const formattedMembers = remainingMembers.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      avatar: m.user.avatar,
      status: m.user.status,
      lastSeen: m.user.lastSeen,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    try {
      const io = getIO();
      io.to(`conv:${id}`).emit("group_member_update", {
        conversationId: id,
        members: formattedMembers,
      });
      io.to(`conv:${id}`).emit("receive_message", {
        message: systemMessage,
        conversationId: id,
      });
      io.to(targetUserId).emit("group_removed", { conversationId: id });
    } catch {}

    res.json({ ok: true, members: formattedMembers, systemMessage });
  } catch (err) {
    console.error("[groupController] removeMember error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
};

// PUT /api/conversations/:id/members/:userId/role — promote / demote member (admin only)
export const updateMemberRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const requesterId = req.userId!;
  const { id, userId: targetUserId } = req.params;
  const { role } = req.body as { role?: "ADMIN" | "MEMBER" };

  if (role !== "ADMIN" && role !== "MEMBER") {
    res.status(400).json({ error: "Valid role ('ADMIN' | 'MEMBER') is required" });
    return;
  }

  try {
    const requesterMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: requesterId } },
      include: { user: { select: { name: true } } },
    });
    if (!requesterMember) {
      res.status(403).json({ error: "Not a member of this conversation" });
      return;
    }
    if (requesterMember.role !== "ADMIN") {
      res.status(403).json({ error: "Admin privileges required" });
      return;
    }

    const targetMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
      include: { user: { select: { name: true } } },
    });
    if (!targetMember) {
      res.status(404).json({ error: "User is not a member of this group" });
      return;
    }

    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId: id, userId: targetUserId } },
      data: { role },
    });

    const content =
      role === "ADMIN"
        ? `${requesterMember.user.name} made ${targetMember.user.name} an admin`
        : `${requesterMember.user.name} removed ${targetMember.user.name} as admin`;

    const systemMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: requesterId,
        content,
        type: "SYSTEM",
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const members = await prisma.conversationMember.findMany({
      where: { conversationId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true, status: true, lastSeen: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const formattedMembers = members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      avatar: m.user.avatar,
      status: m.user.status,
      lastSeen: m.user.lastSeen,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    try {
      const io = getIO();
      io.to(`conv:${id}`).emit("group_member_update", {
        conversationId: id,
        members: formattedMembers,
      });
      io.to(`conv:${id}`).emit("receive_message", {
        message: systemMessage,
        conversationId: id,
      });
    } catch {}

    res.json({ ok: true, members: formattedMembers, systemMessage });
  } catch (err) {
    console.error("[groupController] updateMemberRole error:", err);
    res.status(500).json({ error: "Failed to update member role" });
  }
};

// PUT /api/conversations/:id/info — update group name, description, avatar (admin only)
export const updateGroupInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const requesterId = req.userId!;
  const { id } = req.params;
  const { name, description, avatar } = req.body as {
    name?: string;
    description?: string;
    avatar?: string;
  };

  try {
    const requesterMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId: requesterId } },
      include: { user: { select: { name: true } } },
    });
    if (!requesterMember) {
      res.status(403).json({ error: "Not a member of this conversation" });
      return;
    }
    if (requesterMember.role !== "ADMIN") {
      res.status(403).json({ error: "Admin privileges required" });
      return;
    }

    const updateData: { name?: string; description?: string | null; avatar?: string | null } = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (avatar !== undefined) updateData.avatar = avatar || null;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    const systemMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: requesterId,
        content: `${requesterMember.user.name} updated the group info`,
        type: "SYSTEM",
        status: "SENT",
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    try {
      const io = getIO();
      io.to(`conv:${id}`).emit("group_info_update", {
        conversationId: id,
        name: conversation.name,
        description: conversation.description,
        avatar: conversation.avatar,
      });
      io.to(`conv:${id}`).emit("receive_message", {
        message: systemMessage,
        conversationId: id,
      });
    } catch {}

    res.json({
      ok: true,
      conversation: {
        id: conversation.id,
        name: conversation.name,
        description: conversation.description,
        avatar: conversation.avatar,
      },
      systemMessage,
    });
  } catch (err) {
    console.error("[groupController] updateGroupInfo error:", err);
    res.status(500).json({ error: "Failed to update group info" });
  }
};
