import { Router } from "express";
import {
  getConversations,
  getConversationById,
  sendMessage,
  uploadAttachment,
  markMessageRead,
  clearConversation,
  createConversation,
  getUnreadCount,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.use(protect);

router.get("/unread-count", getUnreadCount);
router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversationById);
router.delete("/conversations/:id/clear", clearConversation);
router.post("/messages", sendMessage);
router.put("/messages/:id/read", markMessageRead);
router.post("/upload", upload.single("file"), uploadAttachment);

export default router;
