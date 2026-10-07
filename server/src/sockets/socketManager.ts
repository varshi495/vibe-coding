import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken } from "../config/jwt";
import { prisma } from "../config/db";

let io: SocketIOServer;

interface AuthSocket extends Socket {
  userId: string;
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

    // Join personal room for targeted 1-on-1 delivery
    socket.join(userId);

    // Join a conversation room
    socket.on("join_conversation", ({ conversationId }: { conversationId: string }) => {
      socket.join(`conv:${conversationId}`);
    });

    // Handle outgoing direct message
    socket.on(
      "send_message",
      async (data: {
        tempId: string;
        conversationId: string;
        recipientId: string;
        content: string;
      }) => {
        const { tempId, conversationId, recipientId, content } = data;

        if (!content?.trim()) {
          socket.emit("message_error", { tempId, error: "Empty message" });
          return;
        }

        try {
          const message = await prisma.message.create({
            data: {
              conversationId,
              senderId: userId,
              content: content.trim(),
              status: "SENT",
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
          io.to(recipientId).emit("receive_message", { message, conversationId });
          socket.to(`conv:${conversationId}`).emit("receive_message", { message, conversationId });
        } catch (err) {
          console.error("[socket] send_message error:", err);
          socket.emit("message_error", { tempId, error: "Failed to send message. Please try again." });
        }
      }
    );

    socket.on("disconnect", (reason) => {
      console.log(`[socket] User ${userId} disconnected (${reason}): ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}
