import { Router } from "express";
import {
  createSubWing,
  addSubWingMember,
  getAllSubWings,
  getSubWingMembers,
} from "../controllers/subwingController";
import { upload } from "../helpers/upload";

const router = Router();

// ✅ Create a Sub-Wing (with optional SVG icon)
router.post("/", upload.single("file"), createSubWing);

// ✅ Get All Sub-Wings with Members
router.get("/", getAllSubWings);

// ✅ Add a Member to a Sub-Wing (with optional image)
router.post("/:subWingId/members", upload.single("file"), addSubWingMember);

// ✅ Get Members of a Specific Sub-Wing
router.get("/:subWingId/members", getSubWingMembers);
export default router;
