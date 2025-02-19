"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/register-event", authMiddleware_1.authenticateUser, userController_1.registerForEvent);
router.get("/events/:eventId", userController_1.getEventById);
router.get("/events", userController_1.getEvents);
router.get("/home", userController_1.homePageData);
exports.default = router;
