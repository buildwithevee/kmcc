import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware";
import {
    addAirport,
    getAllAirports,
    getAirportById,
    updateAirport,
    deleteAirport
} from "../controllers/AirportController";

const router = express.Router();

// Public routes
router.get("/", getAllAirports);
router.get("/:id", getAirportById);

// Protected routes (Only Admins)
router.post("/", authenticateUser, addAirport);
router.put("/:id", authenticateUser, updateAirport);
router.delete("/:id", authenticateUser, deleteAirport);

export default router;
