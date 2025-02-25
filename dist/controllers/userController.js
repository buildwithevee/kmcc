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
exports.getProfile = exports.updateProfile = exports.uploadAvatar = exports.homePageData = exports.registerForEvent = exports.getEventById = exports.getEvents = void 0;
const sharp_1 = __importDefault(require("sharp"));
const db_1 = require("../config/db");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getEvents = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const totalEvents = yield db_1.prismaClient.event.count();
    const events = yield db_1.prismaClient.event.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            eventDate: true,
            place: true,
            timing: true,
            highlights: true,
            eventType: true,
            image: true,
            isFinished: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, {
        totalEvents,
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        data: events
    }, "Events retrieved successfully"));
}));
exports.getEventById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const eventId = Number(req.params.eventId);
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!eventId)
        throw new apiHandlerHelpers_1.ApiError(400, "Event ID is required");
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: eventId },
        include: { registrations: true },
    });
    if (!event)
        throw new apiHandlerHelpers_1.ApiError(404, "Event not found");
    const isRegistered = event.registrations.some(reg => reg.userId === userId);
    res.json(new apiHandlerHelpers_1.ApiResponse(200, { event, isRegistered }, "Event details retrieved successfully"));
}));
exports.registerForEvent = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { eventId } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId)
        throw new apiHandlerHelpers_1.ApiError(401, "User is not authenticated.");
    if (!eventId)
        throw new apiHandlerHelpers_1.ApiError(400, "Event ID is required.");
    const existingRegistration = yield db_1.prismaClient.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });
    if (existingRegistration)
        throw new apiHandlerHelpers_1.ApiError(400, "You are already registered for this event.");
    const registration = yield db_1.prismaClient.eventRegistration.create({
        data: { eventId, userId },
        select: { id: true, eventId: true, userId: true, isAttended: true, createdAt: true },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(201, registration, "Successfully registered for the event"));
}));
exports.homePageData = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const [events, services, jobs, banner, newsList] = yield Promise.all([
        db_1.prismaClient.event.findMany({
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
                id: true,
                title: true,
                eventDate: true,
                place: true,
                timing: true,
                highlights: true,
                eventType: true,
                image: true,
                isFinished: true,
                createdAt: true,
                updatedAt: true,
                registrations: {
                    take: 3, // Get only 3 registered users per event
                    select: {
                        user: {
                            select: {
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        }),
        db_1.prismaClient.service.findMany({
            take: 4,
            orderBy: { createdAt: "desc" },
        }),
        db_1.prismaClient.job.findMany({
            take: 4,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                companyName: true,
                logo: true,
                position: true,
                jobMode: true,
                salary: true,
                place: true,
            },
        }),
        db_1.prismaClient.banner.findFirst(),
        db_1.prismaClient.news.findMany({
            take: 5,
            select: {
                id: true,
                type: true,
                heading: true,
                author: true,
                createdAt: true,
                image: true, // Binary data
            },
            orderBy: { createdAt: "desc" }, // Sort by latest news
        }),
    ]);
    // Convert banner image if available
    const bannerImage = (banner === null || banner === void 0 ? void 0 : banner.image)
        ? `data:image/jpeg;base64,${Buffer.from(banner.image).toString("base64")}`
        : null;
    // Extract profile images of registered users
    const formattedEvents = events.map(event => (Object.assign(Object.assign({}, event), { image: event.image ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}` : null, registeredUserImages: event.registrations
            .map(reg => reg.user.profileImage ? `data:image/jpeg;base64,${Buffer.from(reg.user.profileImage).toString("base64")}` : null)
            .filter(Boolean) })));
    const formattedNews = newsList.map(news => ({
        id: news.id,
        type: news.type,
        heading: news.heading,
        author: news.author,
        createdAt: news.createdAt,
        image: news.image ? `data:image/jpeg;base64,${Buffer.from(news.image).toString("base64")}` : null,
    }));
    const formattedJobs = jobs.map(job => (Object.assign(Object.assign({}, job), { logo: job.logo ? `data:image/jpeg;base64,${Buffer.from(job.logo).toString("base64")}` : null })));
    res.json(new apiHandlerHelpers_1.ApiResponse(200, { bannerImage, events: formattedEvents, jobs: formattedJobs, services, news: formattedNews }, "Home retrieved successfully"));
}));
exports.uploadAvatar = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Ensure user is authenticated
    if (!req.file) {
        return res.status(400).json(new apiHandlerHelpers_1.ApiResponse(400, {}, "Provide file"));
    }
    // Convert image to buffer and optimize size
    const resizedImage = yield (0, sharp_1.default)(req.file.buffer).resize(150, 150).toBuffer();
    // Update the user's avatar in the database
    yield db_1.prismaClient.user.update({
        where: { id: userId },
        data: { profileImage: resizedImage },
    });
    return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {}, "file uploaded successfully"));
}));
exports.updateProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(401).json(new apiHandlerHelpers_1.ApiResponse(401, {}, "Unauthorized"));
    }
    const { occupation, employer, place, dateOfBirth, bloodGroup } = req.body;
    // Convert date string to Date object
    const dob = dateOfBirth ? new Date(dateOfBirth) : undefined;
    // Find profile
    let profile = yield db_1.prismaClient.profile.findUnique({
        where: { userId },
    });
    if (!profile) {
        // Create a new profile if it doesn't exist
        profile = yield db_1.prismaClient.profile.create({
            data: {
                userId,
                occupation,
                employer,
                place,
                dateOfBirth: dob,
                bloodGroup,
            },
        });
    }
    else {
        // Update the existing profile
        profile = yield db_1.prismaClient.profile.update({
            where: { userId },
            data: {
                occupation,
                employer,
                place,
                dateOfBirth: dob,
                bloodGroup,
            },
        });
    }
    return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, profile, "Profile updated successfully"));
}));
exports.getProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        return res.status(401).json(new apiHandlerHelpers_1.ApiResponse(401, {}, "Unauthorized"));
    }
    // Fetch profile along with user details (including profileImage)
    const profile = yield db_1.prismaClient.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            phoneNumber: true,
            profileImage: true, // Get profile image
            profile: true, // Get profile details
        },
    });
    if (!profile) {
        return res.status(404).json(new apiHandlerHelpers_1.ApiResponse(404, {}, "Profile not found"));
    }
    return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, profile, "Profile retrieved successfully"));
}));
