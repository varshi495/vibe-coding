import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getMessageTypeFromMime } from '../middleware/uploadMiddleware';
import { getIO } from '../sockets/socketManager';
import { MessageType } from '@prisma/client';

// POST /api/media/upload — upload a single media file
export const uploadMedia = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const category = getMessageTypeFromMime(req.file.mimetype);
  if (!category) {
    res.status(400).json({ error: `Disallowed file type: ${req.file.mimetype}` });
    return;
  }

  const mediaUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    url: mediaUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mediaType: req.file.mimetype,
    messageType: category as MessageType,
  });
};

// POST /api/conversations/:id/messages/media — create and broadcast a media message
export const sendMediaMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id: conversationId } = req.params;
  const { mediaUrl, mediaType, fileName, fileSize, type, caption } = req.body as {
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    fileSize?: number;
    type?: MessageType;
    caption?: string;
  };

  if (!mediaUrl) {
    res.status(400).json({ error: 'mediaUrl is required' });
    return;
  }

  try {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!membership) {
      res.status(403).json({ error: 'Not a member of this conversation' });
      return;
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const messageType: MessageType =
      type && ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'].includes(type)
        ? type
        : 'DOCUMENT';

    const contentText = caption?.trim() || fileName || '';

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: contentText,
        type: messageType,
        mediaUrl,
        mediaType: mediaType || null,
        fileName: fileName || null,
        fileSize: fileSize ? Number(fileSize) : null,
        status: 'SENT',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast over Socket.IO
    try {
      const io = getIO();
      io.to(`conv:${conversationId}`).emit('receive_message', {
        message,
        conversationId,
      });

      // If 1-on-1, also emit to recipient's personal room
      if (!conv.isGroup) {
        const other = conv.members.find((m) => m.userId !== userId);
        if (other) {
          io.to(other.userId).emit('receive_message', {
            message,
            conversationId,
          });
        }
      }
    } catch {
      // Socket not ready or in test environment without active socket
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('[mediaController] sendMediaMessage error:', err);
    res.status(500).json({ error: 'Failed to send media message' });
  }
};
