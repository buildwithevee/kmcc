import { Router } from "express";
import {
  createSubWing,
  addSubWingMember,
  getAllSubWings,
  getSubWingMembers,
  getSubWingDetails,
} from "../controllers/subwingController";
import { upload } from "../helpers/upload";

const router = Router();

// Create sub-wing with optional icon
router.post("/", upload.single("icon"), createSubWing);

// Get all sub-wings
router.get("/", getAllSubWings);

// Get specific sub-wing details
router.get("/:subWingId", getSubWingDetails);

// Add member to sub-wing with optional image
router.post("/:subWingId/members", upload.single("image"), addSubWingMember);

// Get members of specific sub-wing
router.get("/:subWingId/members", getSubWingMembers);

export default router;
