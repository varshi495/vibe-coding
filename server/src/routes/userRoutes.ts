import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { searchUsers, getUserPresence } from "../controllers/userController";

const router = Router();

router.use(authenticateToken);
router.get("/search", searchUsers);
router.get("/presence", getUserPresence);

export default router;
