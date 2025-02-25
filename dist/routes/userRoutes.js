"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upload_1 = require("@/helpers/upload");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/register-event", authMiddleware_1.authenticateUser, userController_1.registerForEvent);
router.get("/events/:eventId", userController_1.getEventById);
router.get("/events", userController_1.getEvents);
router.get("/home", userController_1.homePageData);
router.put("/upload-avatar", authMiddleware_1.authenticateUser, upload_1.upload.single("avatar"), userController_1.uploadAvatar);
router.put("/update", authMiddleware_1.authenticateUser, userController_1.updateProfile);
router.get("/me", authMiddleware_1.authenticateUser, userController_1.getProfile);
exports.default = router;
