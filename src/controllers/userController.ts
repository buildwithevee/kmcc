import sharp from "sharp";
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



export const homePageData = asyncHandler(async (req: Request, res: Response) => {
    const [events, services, jobs, banner, newsList] = await Promise.all([
        prismaClient.event.findMany({
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
        prismaClient.service.findMany({
            take: 4,
            orderBy: { createdAt: "desc" },
        }),
        prismaClient.job.findMany({
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
        prismaClient.banner.findFirst(),
        prismaClient.news.findMany({
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
    const bannerImage = banner?.image
        ? `data:image/jpeg;base64,${Buffer.from(banner.image).toString("base64")}`
        : null;

    // Extract profile images of registered users
    const formattedEvents = events.map(event => ({
        ...event,
        image: event.image ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}` : null,
        registeredUserImages: event.registrations
            .map(reg => reg.user.profileImage ? `data:image/jpeg;base64,${Buffer.from(reg.user.profileImage).toString("base64")}` : null)
            .filter(Boolean), // Exclude null values
    }));
    const formattedNews = newsList.map(news => ({
        id: news.id,
        type: news.type,
        heading: news.heading,
        author: news.author,
        createdAt: news.createdAt,
        image: news.image ? `data:image/jpeg;base64,${Buffer.from(news.image).toString("base64")}` : null,
    }));
    const formattedJobs = jobs.map(job => ({
        ...job,
        logo: job.logo ? `data:image/jpeg;base64,${Buffer.from(job.logo).toString("base64")}` : null,
    }));

    res.json(new ApiResponse(200, { bannerImage, events: formattedEvents, jobs: formattedJobs, services, news: formattedNews }, "Home retrieved successfully"));
});



export const uploadAvatar = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId; // Ensure user is authenticated
        if (!req.file) {
          return res.status(400).json(new ApiResponse(400,{},"Provide file"));
        }
    
        // Convert image to buffer and optimize size
        const resizedImage = await sharp(req.file.buffer).resize(150, 150).toBuffer();
    
        // Update the user's avatar in the database
        await prismaClient.user.update({
          where: { id: userId },
          data: { profileImage: resizedImage },
        });
    
        return res.status(200).json(new ApiResponse(200,{},"file uploaded successfully"));
    }
)



export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
    }

    const { 
        name, email, phoneNumber, gender, // User fields
        occupation, employer, place, dateOfBirth, bloodGroup, kmccPosition, address // Profile fields
    } = req.body;

    // Convert dateOfBirth to Date object
    const formattedDOB = dateOfBirth ? new Date(dateOfBirth) : undefined;

    // Update User Table
    const user = await prismaClient.user.update({
        where: { id: userId },
        data: { 
            name, 
            email, 
            phoneNumber, 
            gender 
        },
    });

    // Update or Create Profile
    const profile = await prismaClient.profile.upsert({
        where: { userId },
        update: { 
            occupation, 
            employer, 
            place, 
            dateOfBirth: formattedDOB, 
            bloodGroup, 
            kmccPosition, 
            address 
        },
        create: { 
            userId, 
            occupation, 
            employer, 
            place, 
            dateOfBirth: formattedDOB, 
            bloodGroup, 
            kmccPosition, 
            address 
        },
    });

    return res.status(200).json(new ApiResponse(200, { user, profile }, "Profile updated successfully"));
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json(new ApiResponse(401, {}, "Unauthorized"));
    }

    // Fetch user details with profile
    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            gender: true,
            phoneNumber: true,
            profileImage: true,
            profile: {
                select: {
                    occupation: true,
                    employer: true,
                    place: true,
                    dateOfBirth: true,
                    bloodGroup: true,
                    kmccPosition: true,
                    address: true,
                },
            },
        },
    });

    if (!user) {
        return res.status(404).json(new ApiResponse(404, {}, "Profile not found"));
    }

    return res.status(200).json(new ApiResponse(200, user, "Profile retrieved successfully"));
});

