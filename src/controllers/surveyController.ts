import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiResponse } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import sharp from "sharp";

// ✅ Create a new survey
export const createSurvey = asyncHandler(async (req: Request, res: Response) => {
    const { title, questions } = req.body;

    // Create new survey
    const newSurvey = await prismaClient.survey.create({
        data: {
            title,
            questions,
        },
    });

    // Get all existing users
    const users = await prismaClient.user.findMany();

    // Create survey progress for existing users
    const surveyProgressEntries = users.map(user => ({
        userId: user.id,
        surveyId: newSurvey.id,
        completed: false,
        lastQuestionId: null,
    }));

    if (surveyProgressEntries.length > 0) {
        await prismaClient.userSurveyProgress.createMany({
            data: surveyProgressEntries,
        });
    }

    res.status(201).json(new ApiResponse(201, newSurvey, "Survey created successfully, and progress updated for users"));
});



// ✅ Get all active surveys
export const getSurveys = asyncHandler(async (req: Request, res: Response) => {
    const surveys = await prismaClient.survey.findMany({
        where: { isActive: true },
    });
    res.status(200).json(new ApiResponse(200, { surveys }, "Fetched all active surveys"));
});


// ✅ Add a question to a survey
export const addQuestions = asyncHandler(async (req: Request, res: Response) => {
    const { surveyId, text, type, options } = req.body;
    if (!surveyId || !text || !type) {
        return res.status(400).json(new ApiResponse(400, {}, "All fields are required"));
    }

    const survey = await prismaClient.survey.findUnique({ where: { id: parseInt(surveyId) } });
    if (!survey) {
        return res.status(404).json(new ApiResponse(404, {}, "Invalid survey ID"));
    }

    if (!req.file) {
        throw new ApiError(400, "Image is required.");
    }
    const compressedImage = await sharp(req.file.buffer)
        .resize(300, 200)
        .jpeg({ quality: 80 })
        .toBuffer();

    const question = await prismaClient.question.create({
        data: {
            surveyId: parseInt(surveyId),
            text,
            type,
            options: type === "multiple_choice" ? (Array.isArray(options) ? options : JSON.parse(options)) : null,
            image: compressedImage
        },
    });

    res.status(200).json(new ApiResponse(200, { question }, "Question added successfully"));
});


// ✅ Get user's pending active survey
export const getPendingSurveyForAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json(new ApiResponse(400, {}, "User ID is required"));
    }

    const pendingSurvey = await prismaClient.userSurveyProgress.findFirst({
        where: { userId: parseInt(userId), completed: false, survey: { isActive: true } },
        include: { survey: { include: { questions: true } } },
        orderBy: { surveyId: "asc" },
    });

    if (!pendingSurvey) {
        return res.status(200).json(new ApiResponse(200, { completed: true }, "No pending surveys"));
    }

    res.status(200).json(new ApiResponse(200, { survey: pendingSurvey.survey }, "Pending survey found"));
});

// ✅ Ensure survey progress exists before checking pending surveys
async function ensureSurveyProgressForUser(userId: number) {
    const surveys = await prismaClient.survey.findMany();
    const existingProgress = await prismaClient.userSurveyProgress.findMany({
        where: { userId },
    });

    const existingSurveyIds = new Set(existingProgress.map(sp => sp.surveyId));
    const missingSurveys = surveys.filter(s => !existingSurveyIds.has(s.id));

    if (missingSurveys.length > 0) {
        await prismaClient.userSurveyProgress.createMany({
            data: missingSurveys.map(survey => ({
                userId,
                surveyId: survey.id,
                completed: false,
                lastQuestionId: null,
            })),
        });
    }
}

// ✅ Get user's pending active survey
export const getPendingSurvey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(400).json(new ApiResponse(400, {}, "User ID is required"));
    }

    // ✅ Ensure survey progress exists for this user
    await ensureSurveyProgressForUser(userId);

    // ✅ Find the first pending survey
    const pendingSurvey = await prismaClient.userSurveyProgress.findFirst({
        where: {
            userId,
            completed: false,
        },
        include: {
            survey: true,  // Join survey table
        },
        orderBy: { surveyId: "asc" },
    });

    if (!pendingSurvey || !pendingSurvey.survey.isActive) {
        return res.status(200).json(new ApiResponse(200, { completed: true }, "No pending surveys"));
    }

    const surveyId = pendingSurvey.surveyId;

    // ✅ Get total questions in the survey
    const totalQuestions = await prismaClient.question.count({
        where: { surveyId },
    });

    if (totalQuestions === 0) {
        return res.status(200).json(new ApiResponse(200, {}, "Survey has no questions"));
    }

    // ✅ Get answered questions count
    const answeredQuestions = await prismaClient.userSurveyAnswer.count({
        where: { surveyId, userId },
    });

    // ✅ Get all questions in survey
    const allQuestions = await prismaClient.question.findMany({
        where: { surveyId },
        orderBy: { id: "asc" },
    });

    // ✅ Find unanswered questions
    const answeredQuestions1 = await prismaClient.userSurveyAnswer.findMany({
        where: { surveyId, userId },
        select: { questionId: true },
    });

    const answeredQuestionIds = new Set(answeredQuestions1.map(q => q.questionId));
    const pendingQuestion = allQuestions.find(q => !answeredQuestionIds.has(q.id));

    // ✅ Mark survey as completed if all questions are answered
    if (!pendingQuestion) {
        await prismaClient.userSurveyProgress.updateMany({
            where: { userId, surveyId },
            data: { completed: true },
        });
        return res.status(200).json(new ApiResponse(200, {}, "Survey already completed"));
    }

    // ✅ Convert image to Base64 format
    const output = {
        ...pendingQuestion,
        image: pendingQuestion.image
            ? `data:image/jpeg;base64,${Buffer.from(pendingQuestion.image).toString("base64")}`
            : null, // Handle cases where image might be null
    };

    // ✅ Calculate progress
    const progress = {
        totalQuestions,
        answeredQuestions,
        remainingQuestions: totalQuestions - answeredQuestions,
        percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };

    res.status(200).json(new ApiResponse(200, { surveyId, progress, output }, "Pending survey found"));
});


// ✅ Get pending question for a user in a survey
export const getPendingQuestion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { surveyId } = req.params;
    const userId = req.user?.userId;

    if (!surveyId || !userId) {
        return res.status(400).json(new ApiResponse(400, {}, "Survey ID and User ID are required"));
    }

    const allQuestions = await prismaClient.question.findMany({
        where: { surveyId: parseInt(surveyId) },
        orderBy: { id: "asc" }
    });

    const answeredQuestions = await prismaClient.userSurveyAnswer.findMany({
        where: { surveyId: parseInt(surveyId), userId: (userId) },
        select: { questionId: true }
    });

    const answeredQuestionIds = new Set(answeredQuestions.map(q => q.questionId));

    const pendingQuestion = allQuestions.find(q => !answeredQuestionIds.has(q.id));

    if (!pendingQuestion) {
        await prismaClient.userSurveyProgress.updateMany({
            where: { userId: (userId), surveyId: parseInt(surveyId) },
            data: { completed: true }
        });
        return res.status(200).json(new ApiResponse(200, {}, "Survey already completed"));
    }

    const output = {
        ...pendingQuestion,
        image: `data:image/jpeg;base64,${Buffer.from(pendingQuestion.image).toString("base64")}`
    }

    res.status(200).json(new ApiResponse(200, { output }, "Next pending question"));
});

// ✅ Submit an answer and track progress
export const submitAnswer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { surveyId, questionId, answer } = req.body;
    const userId = req.user?.userId;

    if (!userId || !surveyId || !questionId || answer === undefined) {
        return res.status(400).json(new ApiResponse(400, {}, "All fields are required"));
    }

    const survey = await prismaClient.survey.findUnique({ where: { id: parseInt(surveyId) } });
    if (!survey) {
        return res.status(404).json(new ApiResponse(404, {}, "Invalid survey ID"));
    }

    const question = await prismaClient.question.findUnique({ where: { id: parseInt(questionId) } });
    if (!question) {
        return res.status(404).json(new ApiResponse(404, {}, "Invalid question ID"));
    }

    await prismaClient.userSurveyAnswer.create({
        data: { userId, surveyId, questionId, answer },
    });

    const remainingQuestions = await prismaClient.question.findMany({
        where: { surveyId: parseInt(surveyId) },
        orderBy: { id: "asc" },
    });

    const answeredQuestions = await prismaClient.userSurveyAnswer.findMany({
        where: { userId, surveyId: parseInt(surveyId) },
    });

    const remainingQuestion = remainingQuestions.find(q =>
        !answeredQuestions.some(a => a.questionId === q.id)
    );

    if (!remainingQuestion) {
        await prismaClient.userSurveyProgress.updateMany({
            where: { userId, surveyId: parseInt(surveyId) },
            data: { completed: true, lastQuestionId: null },
        });
        return res.status(200).json(new ApiResponse(200, { completed: true }, "Survey completed!"));
    }

    await prismaClient.userSurveyProgress.updateMany({
        where: { userId, surveyId: parseInt(surveyId) },
        data: { lastQuestionId: remainingQuestion.id },
    });

    res.status(200).json(new ApiResponse(200, { nextQuestion: { ...remainingQuestion, image: `data:image/jpeg;base64,${Buffer.from(remainingQuestion.image).toString("base64")}` } }, "Next question retrieved"));
});


export const getSurveyProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { surveyId } = req.params;
    const userId = req.user?.userId;
    if (!surveyId || !userId) {
        return res.status(400).json(new ApiResponse(400, {}, "Survey ID and User ID are required"));
    }

    // Get total questions in the survey
    const totalQuestions = await prismaClient.question.count({
        where: { surveyId: parseInt(surveyId) }
    });

    // Get answered questions count
    const answeredQuestions = await prismaClient.userSurveyAnswer.count({
        where: { surveyId: parseInt(surveyId), userId: (userId) }
    });

    const progress = {
        totalQuestions,
        answeredQuestions,
        remainingQuestions: totalQuestions - answeredQuestions,
        percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

    };

    return res.status(200).json(new ApiResponse(200, { progress }, "Survey progress fetched"));
});
