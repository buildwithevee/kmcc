"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSurveyProgress = exports.submitAnswer = exports.getPendingQuestion = exports.getPendingSurvey = exports.getPendingSurveyForAdmin = exports.addQuestions = exports.getSurveys = exports.createSurvey = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
const sharp_1 = __importDefault(require("sharp"));
// ✅ Create a new survey
exports.createSurvey = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, questions } = req.body;
    // Create new survey
    const newSurvey = yield db_1.prismaClient.survey.create({
        data: {
            title,
            questions,
        },
    });
    // Get all existing users
    const users = yield db_1.prismaClient.user.findMany();
    // Create survey progress for existing users
    const surveyProgressEntries = users.map(user => ({
        userId: user.id,
        surveyId: newSurvey.id,
        completed: false,
        lastQuestionId: null,
    }));
    if (surveyProgressEntries.length > 0) {
        yield db_1.prismaClient.userSurveyProgress.createMany({
            data: surveyProgressEntries,
        });
    }
    res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, newSurvey, "Survey created successfully, and progress updated for users"));
}));
// ✅ Get all active surveys
exports.getSurveys = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const surveys = yield db_1.prismaClient.survey.findMany({
        where: { isActive: true },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { surveys }, "Fetched all active surveys"));
}));
// ✅ Add a question to a survey
exports.addQuestions = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { surveyId, text, type, options } = req.body;
    if (!surveyId || !text || !type) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "All fields are required"));
    }
    const survey = yield db_1.prismaClient.survey.findUnique({ where: { id: parseInt(surveyId) } });
    if (!survey) {
        return res.status(404).json(new apiHandlerHelpers_1.ApiResponse(404, {}, "Invalid survey ID"));
    }
    if (!req.file) {
        throw new apiHandlerHelpers_1.ApiError(400, "Image is required.");
    }
    const compressedImage = yield (0, sharp_1.default)(req.file.buffer)
        .resize(300, 200)
        .jpeg({ quality: 80 })
        .toBuffer();
    const question = yield db_1.prismaClient.question.create({
        data: {
            surveyId: parseInt(surveyId),
            text,
            type,
            options: type === "multiple_choice" ? (Array.isArray(options) ? options : JSON.parse(options)) : null,
            image: compressedImage
        },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { question }, "Question added successfully"));
}));
// ✅ Get user's pending active survey
exports.getPendingSurveyForAdmin = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "User ID is required"));
    }
    const pendingSurvey = yield db_1.prismaClient.userSurveyProgress.findFirst({
        where: { userId: parseInt(userId), completed: false, survey: { isActive: true } },
        include: { survey: { include: { questions: true } } },
        orderBy: { surveyId: "asc" },
    });
    if (!pendingSurvey) {
        return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { completed: true }, "No pending surveys"));
    }
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { survey: pendingSurvey.survey }, "Pending survey found"));
}));
// ✅ Ensure survey progress exists before checking pending surveys
function ensureSurveyProgressForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const surveys = yield db_1.prismaClient.survey.findMany();
        const existingProgress = yield db_1.prismaClient.userSurveyProgress.findMany({
            where: { userId },
        });
        const existingSurveyIds = new Set(existingProgress.map(sp => sp.surveyId));
        const missingSurveys = surveys.filter(s => !existingSurveyIds.has(s.id));
        if (missingSurveys.length > 0) {
            yield db_1.prismaClient.userSurveyProgress.createMany({
                data: missingSurveys.map(survey => ({
                    userId,
                    surveyId: survey.id,
                    completed: false,
                    lastQuestionId: null,
                })),
            });
        }
    });
}
// ✅ Get user's pending active survey
exports.getPendingSurvey = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "User ID is required"));
    }
    // ✅ Ensure survey progress exists for this user
    yield ensureSurveyProgressForUser(userId);
    // ✅ Find the first pending survey
    const pendingSurvey = yield db_1.prismaClient.userSurveyProgress.findFirst({
        where: {
            userId,
            completed: false,
        },
        include: {
            survey: true, // Join survey table
        },
        orderBy: { surveyId: "asc" },
    });
    if (!pendingSurvey || !pendingSurvey.survey.isActive) {
        return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { completed: true }, "No pending surveys"));
    }
    const surveyId = pendingSurvey.surveyId;
    // ✅ Get total questions in the survey
    const totalQuestions = yield db_1.prismaClient.question.count({
        where: { surveyId },
    });
    if (totalQuestions === 0) {
        return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {}, "Survey has no questions"));
    }
    // ✅ Get answered questions count
    const answeredQuestions = yield db_1.prismaClient.userSurveyAnswer.count({
        where: { surveyId, userId },
    });
    // ✅ Get all questions in survey
    const allQuestions = yield db_1.prismaClient.question.findMany({
        where: { surveyId },
        orderBy: { id: "asc" },
    });
    // ✅ Find unanswered questions
    const answeredQuestions1 = yield db_1.prismaClient.userSurveyAnswer.findMany({
        where: { surveyId, userId },
        select: { questionId: true },
    });
    const answeredQuestionIds = new Set(answeredQuestions1.map(q => q.questionId));
    const pendingQuestion = allQuestions.find(q => !answeredQuestionIds.has(q.id));
    // ✅ Mark survey as completed if all questions are answered
    if (!pendingQuestion) {
        yield db_1.prismaClient.userSurveyProgress.updateMany({
            where: { userId, surveyId },
            data: { completed: true },
        });
        return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {}, "Survey already completed"));
    }
    // ✅ Convert image to Base64 format
    const output = Object.assign(Object.assign({}, pendingQuestion), { image: pendingQuestion.image
            ? `data:image/jpeg;base64,${Buffer.from(pendingQuestion.image).toString("base64")}`
            : null });
    // ✅ Calculate progress
    const progress = {
        totalQuestions,
        answeredQuestions,
        remainingQuestions: totalQuestions - answeredQuestions,
        percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { surveyId, progress, output }, "Pending survey found"));
}));
// ✅ Get pending question for a user in a survey
exports.getPendingQuestion = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { surveyId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!surveyId || !userId) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "Survey ID and User ID are required"));
    }
    const allQuestions = yield db_1.prismaClient.question.findMany({
        where: { surveyId: parseInt(surveyId) },
        orderBy: { id: "asc" }
    });
    const answeredQuestions = yield db_1.prismaClient.userSurveyAnswer.findMany({
        where: { surveyId: parseInt(surveyId), userId: (userId) },
        select: { questionId: true }
    });
    const answeredQuestionIds = new Set(answeredQuestions.map(q => q.questionId));
    const pendingQuestion = allQuestions.find(q => !answeredQuestionIds.has(q.id));
    if (!pendingQuestion) {
        yield db_1.prismaClient.userSurveyProgress.updateMany({
            where: { userId: (userId), surveyId: parseInt(surveyId) },
            data: { completed: true }
        });
        return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {}, "Survey already completed"));
    }
    const output = Object.assign(Object.assign({}, pendingQuestion), { image: `data:image/jpeg;base64,${Buffer.from(pendingQuestion.image).toString("base64")}` });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { output }, "Next pending question"));
}));
// ✅ Submit an answer and track progress
exports.submitAnswer = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { surveyId, questionId, answer } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId || !surveyId || !questionId || answer === undefined) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "All fields are required"));
    }
    const survey = yield db_1.prismaClient.survey.findUnique({ where: { id: parseInt(surveyId) } });
    if (!survey) {
        return res.status(404).json(new apiHandlerHelpers_1.ApiResponse(404, {}, "Invalid survey ID"));
    }
    const question = yield db_1.prismaClient.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) {
        return res.status(404).json(new apiHandlerHelpers_1.ApiResponse(404, {}, "Invalid question ID"));
    }
    yield db_1.prismaClient.userSurveyAnswer.create({
        data: { userId, surveyId, questionId, answer },
    });
    const remainingQuestions = yield db_1.prismaClient.question.findMany({
        where: { surveyId: parseInt(surveyId) },
        orderBy: { id: "asc" },
    });
    const answeredQuestions = yield db_1.prismaClient.userSurveyAnswer.findMany({
        where: { userId, surveyId: parseInt(surveyId) },
    });
    const remainingQuestion = remainingQuestions.find(q => !answeredQuestions.some(a => a.questionId === q.id));
    if (!remainingQuestion) {
        yield db_1.prismaClient.userSurveyProgress.updateMany({
            where: { userId, surveyId: parseInt(surveyId) },
            data: { completed: true, lastQuestionId: null },
        });
        return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { completed: true }, "Survey completed!"));
    }
    yield db_1.prismaClient.userSurveyProgress.updateMany({
        where: { userId, surveyId: parseInt(surveyId) },
        data: { lastQuestionId: remainingQuestion.id },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { nextQuestion: Object.assign(Object.assign({}, remainingQuestion), { image: `data:image/jpeg;base64,${Buffer.from(remainingQuestion.image).toString("base64")}` }) }, "Next question retrieved"));
}));
exports.getSurveyProgress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { surveyId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!surveyId || !userId) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "Survey ID and User ID are required"));
    }
    // Get total questions in the survey
    const totalQuestions = yield db_1.prismaClient.question.count({
        where: { surveyId: parseInt(surveyId) }
    });
    // Get answered questions count
    const answeredQuestions = yield db_1.prismaClient.userSurveyAnswer.count({
        where: { surveyId: parseInt(surveyId), userId: (userId) }
    });
    const progress = {
        totalQuestions,
        answeredQuestions,
        remainingQuestions: totalQuestions - answeredQuestions,
        percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    };
    return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, { progress }, "Survey progress fetched"));
}));
