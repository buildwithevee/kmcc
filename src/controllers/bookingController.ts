import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";

// ✅ Book a Service
export const bookService = asyncHandler(async (req: Request, res: Response) => {
    const { serviceId, userId, date } = req.body;

    if (!serviceId || !userId || !date) {
        throw new ApiError(400, "Service ID, User ID, and date are required.");
    }

    const booking = await prismaClient.serviceBooking.create({
        data: { serviceId, userId, date, status: "pending" },
    });

    res.status(201).json(new ApiResponse(201, booking, "Service booked successfully."));
});

// ✅ Get Bookings for a Service
export const getServiceBookings = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.serviceId);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const bookings = await prismaClient.serviceBooking.findMany({ where: { serviceId } });

    res.status(200).json(new ApiResponse(200, bookings, "Bookings retrieved successfully."));
});

// ✅ Update Booking Status
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const bookingId = Number(req.params.id);
    const { status } = req.body;

    if (isNaN(bookingId)) throw new ApiError(400, "Invalid booking ID.");
    if (!status) throw new ApiError(400, "Status is required.");

    const booking = await prismaClient.serviceBooking.update({
        where: { id: bookingId },
        data: { status },
    });

    res.status(200).json(new ApiResponse(200, booking, "Booking status updated successfully."));
});
