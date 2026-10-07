import { Response } from "express";
import { prisma } from "../config/db";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// GET /api/users/search?q=<query> — search registered users (excluding self)
export const searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const q = ((req.query.q as string) || "").trim();

  if (!q || q.length < 2) {
    res.json([]);
    return;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: { id: true, name: true, email: true, phone: true, avatar: true, status: true },
      take: 20,
    });

    res.json(users);
  } catch (err) {
    console.error("[userController] searchUsers error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

// GET /api/users/presence?ids=id1,id2 — batch lookup of user presence & lastSeen
export const getUserPresence = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const idsParam = (req.query.ids as string) || "";
  const userIds = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (userIds.length === 0) {
    res.json([]);
    return;
  }

  try {
    const { isUserOnline } = await import("../sockets/socketManager");
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, lastSeen: true },
    });

    const presenceList = users.map((u) => ({
      id: u.id,
      isOnline: isUserOnline(u.id),
      lastSeen: u.lastSeen,
    }));

    res.json(presenceList);
  } catch (err) {
    console.error("[userController] getUserPresence error:", err);
    res.status(500).json({ error: "Failed to fetch presence" });
  }
};
