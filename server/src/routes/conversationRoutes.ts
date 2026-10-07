import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  markAsRead,
} from "../controllers/conversationController";

const router = Router();

router.use(authenticateToken);

router.get("/", getConversations);
router.post("/", getOrCreateConversation);
router.get("/:id/messages", getMessages);
router.put("/:id/read", markAsRead);

export default router;
