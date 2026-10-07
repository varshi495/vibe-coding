import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken } from "../config/jwt";
import { prisma } from "../config/db";

import { MessageType } from "@prisma/client";

let io: SocketIOServer;

interface AuthSocket extends Socket {
  userId: string;
}

// Track active socket IDs for each userId: Map<userId, Set<socketId>>
const userSockets = new Map<string, Set<string>>();

export function isUserOnline(userId: string): boolean {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
    },
  });

  // JWT handshake middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));
    try {
      const payload = verifyToken(token);
      (socket as AuthSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthSocket;
    const userId = authSocket.userId;
    console.log(`[socket] User ${userId} connected: ${socket.id}`);

    // Track active connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    const userSet = userSockets.get(userId)!;
    const wasOffline = userSet.size === 0;
    userSet.add(socket.id);

    // Join personal room for targeted 1-on-1 delivery
    socket.join(userId);

    // Auto-join all conversation rooms user belongs to (needed for group message broadcast)
    prisma.conversationMember
      .findMany({
        where: { userId },
        select: { conversationId: true },
      })
      .then((memberships) => {
        for (const { conversationId } of memberships) {
          socket.join(`conv:${conversationId}`);
        }
      })
      .catch((err) => {
        console.error("[socket] auto-join conversations error:", err);
      });

    // If this is user's first active socket, broadcast online presence
    if (wasOffline) {
      io.emit("user_presence", { userId, isOnline: true });
    }

    // Join a conversation room
    socket.on("join_conversation", ({ conversationId }: { conversationId: string }) => {
      socket.join(`conv:${conversationId}`);
    });

    // Handle outgoing message (both 1-on-1 and groups, text and media)
    socket.on(
      "send_message",
      async (data: {
        tempId: string;
        conversationId: string;
        recipientId?: string;
        content: string;
        type?: MessageType;
        mediaUrl?: string;
        mediaType?: string;
        fileName?: string;
        fileSize?: number;
      }) => {
        const {
          tempId,
          conversationId,
          recipientId,
          content,
          type,
          mediaUrl,
          mediaType,
          fileName,
          fileSize,
        } = data;

        if (!content?.trim() && !mediaUrl) {
          socket.emit("message_error", { tempId, error: "Empty message" });
          return;
        }

        const msgType: MessageType =
          type && ["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "SYSTEM"].includes(type)
            ? type
            : mediaUrl
            ? "DOCUMENT"
            : "TEXT";

        try {
          const message = await prisma.message.create({
            data: {
              conversationId,
              senderId: userId,
              content: content?.trim() || fileName || "",
              status: "SENT",
              type: msgType,
              mediaUrl: mediaUrl || null,
              mediaType: mediaType || null,
              fileName: fileName || null,
              fileSize: fileSize ? Number(fileSize) : null,
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

          socket.emit("message_ack", { tempId, message });
          socket.to(`conv:${conversationId}`).emit("receive_message", { message, conversationId });
          if (recipientId) {
            io.to(recipientId).emit("receive_message", { message, conversationId });
          }
        } catch (err) {
          console.error("[socket] send_message error:", err);
          socket.emit("message_error", { tempId, error: "Failed to send message. Please try again." });
        }
      }
    );

    // Handle typing events (broadcast to conversation room and recipient)
    socket.on("typing_start", (data: { conversationId: string; recipientId?: string }) => {
      const { conversationId, recipientId } = data;
      if (recipientId) {
        io.to(recipientId).emit("user_typing", { conversationId, userId, isTyping: true });
      }
      socket.to(`conv:${conversationId}`).emit("user_typing", { conversationId, userId, isTyping: true });
    });

    socket.on("typing_stop", (data: { conversationId: string; recipientId?: string }) => {
      const { conversationId, recipientId } = data;
      if (recipientId) {
        io.to(recipientId).emit("user_typing", { conversationId, userId, isTyping: false });
      }
      socket.to(`conv:${conversationId}`).emit("user_typing", { conversationId, userId, isTyping: false });
    });

    // Handle delivery acknowledgment
    socket.on("mark_delivered", async (data: { messageId: string; conversationId: string; senderId: string }) => {
      const { messageId, conversationId, senderId } = data;
      try {
        await prisma.message.updateMany({
          where: { id: messageId, status: "SENT" },
          data: { status: "DELIVERED" },
        });
        io.to(senderId).emit("message_status_update", { messageId, conversationId, status: "DELIVERED" });
      } catch (err) {
        console.error("[socket] mark_delivered error:", err);
      }
    });

    // Handle read acknowledgment
    socket.on("mark_read", async (data: { conversationId: string; senderId: string }) => {
      const { conversationId, senderId } = data;
      try {
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId,
            status: { not: "READ" },
          },
          data: { status: "READ" },
        });

        await prisma.conversationMember.updateMany({
          where: { conversationId, userId },
          data: { lastReadAt: new Date() },
        });

        io.to(senderId).emit("message_status_update", {
          conversationId,
          status: "READ",
          readerId: userId,
        });
      } catch (err) {
        console.error("[socket] mark_read error:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {
      console.log(`[socket] User ${userId} disconnected (${reason}): ${socket.id}`);
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          userSockets.delete(userId);
          const lastSeen = new Date();
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { lastSeen },
            });
          } catch (err) {
            console.error("[socket] lastSeen update error:", err);
          }
          io.emit("user_presence", { userId, isOnline: false, lastSeen: lastSeen.toISOString() });
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
