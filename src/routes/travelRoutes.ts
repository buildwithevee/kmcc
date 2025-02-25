import { Router } from "express";
import { addTravel, getAllTravels, updateTravelStatus, deleteTravel } from "../controllers/TravelController";
import { authenticateUser } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authenticateUser, addTravel);
router.get("/", getAllTravels);
router.put("/:id", authenticateUser, updateTravelStatus);
router.delete("/:id", authenticateUser, deleteTravel); // ✅ Secure delete route

export default router;
