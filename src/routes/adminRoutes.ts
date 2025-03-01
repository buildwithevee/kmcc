import { createEvent, deleteEvent, getAllMemberships, getAllUsers, getBanner, getEventById, getEvents, getUserById, updateEventImage, uploadBanner, uploadMembership, uploadMiddleware } from "../controllers/adminController";
import { upload } from "../helpers/upload";
import express from "express";


const router = express.Router();

// Upload Membership File
router.post("/upload-membership", uploadMiddleware, uploadMembership);
router.get("/see", getAllMemberships);

//banner
router.post("/upload-banner", upload.single("image"), uploadBanner);
router.get("/get-banner", getBanner);

//events
router.post("/create-event", upload.single("image"), createEvent);
router.post("/update-event-image", upload.single("image"), updateEventImage);
router.get("/get-events", getEvents);
router.get("/events/:eventId", getEventById);
router.delete("/event/:eventId", deleteEvent);


router.get('/users', getAllUsers);

// Route to get a single user by ID
router.get('/users/:id', getUserById);

export default router;
