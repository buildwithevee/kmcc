import express from "express";
import {
  createExclusiveMember,
  getAllExclusiveMembers,
  updateExclusiveMember,
  deleteExclusiveMember,
  reorderExclusiveMembers,
} from "../controllers/exclusiveMemberController";
import { upload } from "../helpers/upload";

const router = express.Router();

router.post("/", upload.single("image"), createExclusiveMember);
router.get("/", getAllExclusiveMembers);
router.put("/:id", upload.single("image"), updateExclusiveMember);
router.delete("/:id", deleteExclusiveMember);
router.post("/reorder", reorderExclusiveMembers);

export default router;
