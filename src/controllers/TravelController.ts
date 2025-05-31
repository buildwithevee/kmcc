import { Request, Response } from "express";
import { prismaClient } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendGlobalNotification } from "../utils/notify";

// ➤ Add a travel entry
export const addTravel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { fromAirportId, toAirportId, travelDate, travelTime } = req.body;
    const userId = req.user?.userId;

    if (
      !userId ||
      !fromAirportId ||
      !toAirportId ||
      !travelDate ||
      !travelTime
    ) {
      throw new ApiError(400, "All fields are required.");
    }

    // Validate airports exist
    const [fromAirport, toAirport] = await Promise.all([
      prismaClient.airport.findUnique({ where: { id: fromAirportId } }),
      prismaClient.airport.findUnique({ where: { id: toAirportId } }),
    ]);

    if (!fromAirport || !toAirport) {
      throw new ApiError(400, "Invalid airport selection");
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
        user: { select: { name: true, email: true } },
      },
    });
    await sendGlobalNotification({
      title: "Hey KMCC Members!",
      body: "Check out the latest travel update!",
      data: { type: "news", travelId: travel.id.toString() },
    });

    res
      .status(201)
      .json(new ApiResponse(201, travel, "Travel details added successfully"));
  }
);

// ➤ Get all travel records
export const getAllTravels = asyncHandler(
  async (req: Request, res: Response) => {
    const travels = await prismaClient.travel.findMany({
      include: {
        user: { select: { name: true, email: true } },
        fromAirport: true,
        toAirport: true,
      },
      orderBy: { travelDate: "desc" },
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, travels, "Travel data retrieved successfully")
      );
  }
);

// ➤ Update travel record (full update)
export const updateTravel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { fromAirportId, toAirportId, travelDate, travelTime, status } =
      req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    // Validate required fields
    if (
      !fromAirportId ||
      !toAirportId ||
      !travelDate ||
      !travelTime ||
      !status
    ) {
      throw new ApiError(400, "All fields are required.");
    }

    if (!["AVAILABLE", "ONBOARD", "NOT_AVAILABLE"].includes(status)) {
      throw new ApiError(400, "Invalid status provided");
    }

    // Check if travel record exists
    const travel = await prismaClient.travel.findUnique({
      where: { id: Number(id) },
    });

    if (!travel) {
      throw new ApiError(404, "Travel record not found");
    }

    // Validate airports exist
    const [fromAirport, toAirport] = await Promise.all([
      prismaClient.airport.findUnique({ where: { id: fromAirportId } }),
      prismaClient.airport.findUnique({ where: { id: toAirportId } }),
    ]);

    if (!fromAirport || !toAirport) {
      throw new ApiError(400, "Invalid airport selection");
    }

    // Update travel record
    const updatedTravel = await prismaClient.travel.update({
      where: { id: Number(id) },
      data: {
        fromAirportId,
        toAirportId,
        travelDate: new Date(travelDate),
        travelTime,
        status,
      },
      include: {
        fromAirport: true,
        toAirport: true,
        user: { select: { name: true } },
      },
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedTravel,
          "Travel record updated successfully"
        )
      );
  }
);

export const deleteTravel = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.isAdmin; // Assuming your auth middleware adds isAdmin

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
      throw new ApiError(
        403,
        "You are not authorized to delete this travel record"
      );
    }

    // Delete travel record
    await prismaClient.travel.delete({
      where: { id: Number(id) },
    });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Travel record deleted successfully"));
  }
);

// ➤ Get all airports
export const getAirports = asyncHandler(async (req: Request, res: Response) => {
  const airports = await prismaClient.airport.findMany({
    orderBy: { name: "asc" },
  });

  res
    .status(200)
    .json(new ApiResponse(200, airports, "Airports retrieved successfully"));
});
