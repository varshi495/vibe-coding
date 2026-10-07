import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { searchUsers } from "../controllers/userController";

const router = Router();

router.use(authenticateToken);
router.get("/search", searchUsers);

export default router;
