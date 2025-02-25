import { upload } from "@/helpers/upload";
import { getEventById, getEvents, getProfile, homePageData, registerForEvent, updateProfile, uploadAvatar } from "../controllers/userController";
import { authenticateUser } from "../middlewares/authMiddleware";
import express from "express";

const router = express.Router();


router.post("/register-event", authenticateUser, registerForEvent);
router.get("/events/:eventId", getEventById);
router.get("/events", getEvents);
router.get("/home", homePageData);

router.put("/upload-avatar", authenticateUser, upload.single("avatar"), uploadAvatar);
router.put("/update", authenticateUser, updateProfile);
router.get("/me", authenticateUser, getProfile);

export default router;
