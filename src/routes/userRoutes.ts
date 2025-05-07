import { upload } from "../controllers/adminController";
import {
  getEventById,
  getEvents,
  getProfile,
  homePageData,
  registerForEvent,
  updateProfile,
  uploadAvatar,
  getAttendedEvents, // Add this import
} from "../controllers/userController";
import { authenticateUser } from "../middlewares/authMiddleware";
import express from "express";

const router = express.Router();

router.post("/register-event", authenticateUser, registerForEvent);
router.get("/events/:eventId", authenticateUser, getEventById);
router.get("/events", getEvents);
router.get("/home", homePageData);

router.put(
  "/upload-avatar",
  authenticateUser,
  upload.single("avatar"),
  uploadAvatar
);
router.put("/update", authenticateUser, updateProfile);
router.get("/me", authenticateUser, getProfile);

// Add the new attended events route
router.get("/attended-events", authenticateUser, getAttendedEvents);

export default router;
