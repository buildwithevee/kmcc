import { getEventById, getEvents, homePageData, registerForEvent } from "../controllers/userController";
import { authenticateUser } from "../middlewares/authMiddleware";
import express from "express";

const router = express.Router();


router.post("/register-event", authenticateUser, registerForEvent);
router.get("/events/:eventId", getEventById);
router.get("/events", getEvents);
router.get("/home", homePageData)
export default router;
