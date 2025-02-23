"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const surveyController_1 = require("@/controllers/surveyController");
const authMiddleware_1 = require("@/middlewares/authMiddleware");
const upload_1 = require("@/helpers/upload");
const router = (0, express_1.Router)();
// Survey routes
router.route("/")
    .post(surveyController_1.createSurvey) // Create a new survey
    .get(surveyController_1.getSurveys); // Get all surveys
// Question routes
router.route("/question")
    .post(upload_1.upload.single("image"), surveyController_1.addQuestions); // Add questions to a survey
// Get pending survey for a user admin
router.route("/pending/user/:userId").get(surveyController_1.getPendingSurveyForAdmin);
//get for user
router.route("/pending").get(authMiddleware_1.authenticateUser, surveyController_1.getPendingSurvey);
// Get pending question for a user in a survey
router.route("/pending/survey/:surveyId").get(authMiddleware_1.authenticateUser, surveyController_1.getPendingQuestion);
// Submit an answer
router.route("/submit").post(authMiddleware_1.authenticateUser, surveyController_1.submitAnswer);
router.route("/:surveyId/progress").get(authMiddleware_1.authenticateUser, surveyController_1.getSurveyProgress);
exports.default = router;
