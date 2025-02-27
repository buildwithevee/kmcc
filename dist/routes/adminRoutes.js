"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminController_1 = require("../controllers/adminController");
const upload_1 = require("../helpers/upload");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Upload Membership File
router.post("/upload-membership", adminController_1.uploadMiddleware, adminController_1.uploadMembership);
router.get("/see", adminController_1.getAllMemberships);
//banner
router.post("/upload-banner", upload_1.upload.single("image"), adminController_1.uploadBanner);
router.get("/get-banner", adminController_1.getBanner);
//events
router.post("/create-event", upload_1.upload.single("image"), adminController_1.createEvent);
router.post("/update-event-image", upload_1.upload.single("image"), adminController_1.updateEventImage);
router.get("/get-events", adminController_1.getEvents);
router.get("/events/:eventId", adminController_1.getEventById);
router.delete("/event/:eventId", adminController_1.deleteEvent);
router.get('/users', adminController_1.getAllUsers);
// Route to get a single user by ID
router.get('users/:id', adminController_1.getUserById);
exports.default = router;
