import express from "express";
import {
  createExclusiveMember,
  getAllExclusiveMembers,
  updateExclusiveMemberDetails,
  updateExclusiveMemberImage,
  deleteExclusiveMember,
} from "../controllers/exclusiveMemberController";
import { upload } from "../helpers/upload";

const router = express.Router();

// Exclusive Member Routes
router.post(
  "/",
  upload.single("image"),
  createExclusiveMember
);
router.get("/", getAllExclusiveMembers);
router.put("/:id", updateExclusiveMemberDetails);
router.patch(
  "/:id/image",
  upload.single("image"),
  updateExclusiveMemberImage
);
router.delete("/:id", deleteExclusiveMember);

export default router;
