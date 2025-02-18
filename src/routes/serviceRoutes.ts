import express from "express";
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
} from "../controllers/serviceController";
import { bookService, getServiceBookings, updateBookingStatus } from "../controllers/bookingController";

const router = express.Router();

router.post("/", createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

// Booking routes
router.post("/bookings", bookService);
router.get("/bookings/:serviceId", getServiceBookings);
router.put("/bookings/:id", updateBookingStatus);

export default router;
