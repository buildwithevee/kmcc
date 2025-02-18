import { prismaClient } from "../config/db";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ApiError, ApiResponse } from "../utils/apiHandlerHelpers";
import { asyncHandler } from "../utils/asyncHandler";
import { Response, Request } from "express";

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalEvents = await prismaClient.event.count();
    const events = await prismaClient.event.findMany({
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

    res.json(new ApiResponse(200, {
        totalEvents,
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        data: events
    }, "Events retrieved successfully"));
});


export const getEventById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const eventId = Number(req.params.eventId);
    const userId = req.user?.userId;

    if (!eventId) throw new ApiError(400, "Event ID is required");

    const event = await prismaClient.event.findUnique({
        where: { id: eventId },
        include: { registrations: true },
    });

    if (!event) throw new ApiError(404, "Event not found");

    const isRegistered = event.registrations.some(reg => reg.userId === userId);

    res.json(new ApiResponse(200, { event, isRegistered }, "Event details retrieved successfully"));
});

export const registerForEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { eventId } = req.body;
    const userId = req.user?.userId;

    if (!userId) throw new ApiError(401, "User is not authenticated.");
    if (!eventId) throw new ApiError(400, "Event ID is required.");

    const existingRegistration = await prismaClient.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    if (existingRegistration) throw new ApiError(400, "You are already registered for this event.");

    const registration = await prismaClient.eventRegistration.create({
        data: { eventId, userId },
        select: { id: true, eventId: true, userId: true, isAttended: true, createdAt: true },
    });

    res.json(new ApiResponse(201, registration, "Successfully registered for the event"));
});


