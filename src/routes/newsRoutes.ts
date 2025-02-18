import express from "express";
import { createNews, getAllNews, getNewsById, updateNews, deleteNews } from "../controllers/newsController";
import { upload } from "../helpers/upload";


const router = express.Router();

router.post("/", upload.single("image"), createNews); // ✅ Create News
router.get("/", getAllNews); // ✅ Get All News
router.get("/:id", getNewsById); // ✅ Get Single News
router.put("/:id", upload.single("image"), updateNews); // ✅ Update News
router.delete("/:id", deleteNews); // ✅ Delete News

export default router;
