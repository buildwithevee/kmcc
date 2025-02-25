import { Request, Response } from "express";
import {prismaClient} from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { AuthRequest } from "../middlewares/authMiddleware";

// ➤ Add a travel entry
export const addTravel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fromAirportId, toAirportId, travelDate, travelTime } = req.body;
    const userId=req.user?.userId;
    if (!userId || !fromAirportId || !toAirportId || !travelDate || !travelTime) {
        throw new ApiError(400, "All fields are required.");
    }

    const travel = await prismaClient.travel.create({
        data: {
            userId,
            fromAirportId,
            toAirportId,
            travelDate: new Date(travelDate),
            travelTime,
            status: "AVAILABLE",
        },
        include: {
            fromAirport: true,
            toAirport: true,
        },
    });

    res.status(201).json(new ApiResponse(201, travel, "Travel details added successfully"));
});

// ➤ Get all travel records
export const getAllTravels = asyncHandler(async (req: Request, res: Response) => {
    const travels = await prismaClient.travel.findMany({
        include: {
            user: { select: { name: true, email: true } },
            fromAirport: true,
            toAirport: true,
        },
    });

    res.status(200).json(new ApiResponse(200, travels, "Travel data retrieved successfully"));
});

// ➤ Update travel status
export const updateTravelStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId; // Extract user ID from authenticated request

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!["AVAILABLE", "ONBOARD", "NOT_AVAILABLE"].includes(status)) {
        throw new ApiError(400, "Invalid status provided");
    }

    // Check if the travel record exists and belongs to the user
    const travel = await prismaClient.travel.findUnique({
        where: { id: Number(id) },
    });

    if (!travel) {
        throw new ApiError(404, "Travel record not found");
    }

    if (travel.userId !== userId) {
        throw new ApiError(403, "You are not authorized to update this travel record");
    }

    // Update status
    const updatedTravel = await prismaClient.travel.update({
        where: { id: Number(id) },
        data: { status },
    });

    res.status(200).json(new ApiResponse(200, updatedTravel, "Travel status updated successfully"));
});

export const deleteTravel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId; // Get authenticated user ID
    const isAdmin = req.user?.userId; // Check if user is admin

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Find the travel record
    const travel = await prismaClient.travel.findUnique({
        where: { id: Number(id) },
    });

    if (!travel) {
        throw new ApiError(404, "Travel record not found");
    }

    // Check if the user is the owner or an admin
    if (travel.userId !== userId && !isAdmin) {
        throw new ApiError(403, "You are not authorized to delete this travel record");
    }

    // Delete travel record
    await prismaClient.travel.delete({
        where: { id: Number(id) },
    });

    res.status(200).json(new ApiResponse(200, {}, "Travel record deleted successfully"));
});
