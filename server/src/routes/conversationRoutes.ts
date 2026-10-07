import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  markAsRead,
} from "../controllers/conversationController";
import {
  createGroup,
  getGroupInfo,
  addMember,
  removeMember,
  updateMemberRole,
  updateGroupInfo,
} from "../controllers/groupController";

const router = Router();

router.use(authenticateToken);

router.get("/", getConversations);
router.post("/", getOrCreateConversation);
router.post("/group", createGroup);
router.get("/:id/messages", getMessages);
router.get("/:id", getGroupInfo);
router.put("/:id/read", markAsRead);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);
router.put("/:id/members/:userId/role", updateMemberRole);
router.put("/:id/info", updateGroupInfo);

export default router;

