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
