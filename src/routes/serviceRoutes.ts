import express from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateServiceDetails,
  updateServiceImage,
  deleteService,
  uploadMiddleware,
  updateService,
} from "../controllers/serviceController";
import {
  bookService,
  getServiceBookings,
  updateBookingStatus,
} from "../controllers/bookingController";

const router = express.Router();

// Service routes
router.post("/new", uploadMiddleware, createService);
router.get("/", getAllServices);
router.get("/:id", getServiceById);
router.put("/:id", uploadMiddleware, updateService); // Combined update endpoint
router.delete("/:id", deleteService);

// Booking routes
router.post("/bookings", bookService);
router.get("/bookings/:serviceId", getServiceBookings);
router.put("/bookings/:id", updateBookingStatus);

export default router;
