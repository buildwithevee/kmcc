import {
  addMembershipManually,
  createEvent,
  deleteEvent,
  deleteUser,
  editMembership,
  getAllMemberships,
  getAllUsers,
  getBanner,
  getEventById,
  getEvents,
  getMembershipById,
  getStats,
  getUserById,
  updateEvent,
  updateEventImage,
  updateEventStatus,
  uploadBanner,
  uploadMembership,
  uploadMiddleware,
} from "../controllers/adminController";
import { upload } from "../helpers/upload";
import express from "express";

const router = express.Router();

// Upload Membership File
router.post("/upload-membership", uploadMiddleware, uploadMembership);
router.post("/memberships", addMembershipManually);
router.put("/memberships/:id", editMembership);
router.get("/memberships/:id", getMembershipById); // New endpoint
router.get("/see", getAllMemberships);

//banner
router.post("/upload-banner", upload.single("image"), uploadBanner);
router.get("/get-banner", getBanner);

//events
router.post("/create-event", upload.single("image"), createEvent);
router.post("/events/:eventId", upload.single("image"), updateEvent);
router.post("/update-event-image", upload.single("image"), updateEventImage);
router.get("/get-events", getEvents);
router.get("/events/:eventId", getEventById);
router.delete("/event/:eventId", deleteEvent);
router.patch("/status/event/:eventId", updateEventStatus);

router.get("/users", getAllUsers);

// Route to get a single user by ID
router.get("/users/:id", getUserById);

router.delete("/users/:userId", deleteUser);
router.route("/stats").get(getStats);
export default router;
