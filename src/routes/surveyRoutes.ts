import { Router } from "express";
import {
    createSurvey,
    getSurveys,
    addQuestions,
    getPendingSurvey,
    getPendingQuestion,
    submitAnswer,
    getSurveyProgress,
    getPendingSurveyForAdmin
} from "../controllers/surveyController";
import { authenticateUser } from "../middlewares/authMiddleware";
import { upload } from "../helpers/upload";

const router = Router();

// Survey routes
router.route("/")
    .post(createSurvey)   // Create a new survey
    .get(getSurveys);     // Get all surveys

// Question routes
router.route("/question")
    .post(upload.single("image"), addQuestions);  // Add questions to a survey

// Get pending survey for a user admin
router.route("/pending/user/:userId").get(getPendingSurveyForAdmin);
//get for user
router.route("/pending").get(authenticateUser, getPendingSurvey);

// Get pending question for a user in a survey
router.route("/pending/survey/:surveyId").get(authenticateUser, getPendingQuestion);

// Submit an answer
router.route("/submit").post(authenticateUser, submitAnswer);

router.route("/:surveyId/progress").get(authenticateUser, getSurveyProgress);

export default router;
