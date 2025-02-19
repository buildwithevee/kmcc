"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serviceController_1 = require("../controllers/serviceController");
const bookingController_1 = require("../controllers/bookingController");
const router = express_1.default.Router();
router.post("/", serviceController_1.createService);
router.get("/", serviceController_1.getAllServices);
router.get("/:id", serviceController_1.getServiceById);
router.put("/:id", serviceController_1.updateService);
router.delete("/:id", serviceController_1.deleteService);
// Booking routes
router.post("/bookings", bookingController_1.bookService);
router.get("/bookings/:serviceId", bookingController_1.getServiceBookings);
router.put("/bookings/:id", bookingController_1.updateBookingStatus);
exports.default = router;
