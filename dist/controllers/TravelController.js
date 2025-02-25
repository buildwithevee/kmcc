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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTravel = exports.updateTravelStatus = exports.getAllTravels = exports.addTravel = void 0;
const db_1 = require("../config/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
// ➤ Add a travel entry
exports.addTravel = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { fromAirportId, toAirportId, travelDate, travelTime } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId || !fromAirportId || !toAirportId || !travelDate || !travelTime) {
        throw new apiHandlerHelpers_1.ApiError(400, "All fields are required.");
    }
    const travel = yield db_1.prismaClient.travel.create({
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
    res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, travel, "Travel details added successfully"));
}));
// ➤ Get all travel records
exports.getAllTravels = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const travels = yield db_1.prismaClient.travel.findMany({
        include: {
            user: { select: { name: true, email: true } },
            fromAirport: true,
            toAirport: true,
        },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, travels, "Travel data retrieved successfully"));
}));
// ➤ Update travel status
exports.updateTravelStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { status } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Extract user ID from authenticated request
    if (!userId) {
        throw new apiHandlerHelpers_1.ApiError(401, "Unauthorized");
    }
    if (!["AVAILABLE", "ONBOARD", "NOT_AVAILABLE"].includes(status)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid status provided");
    }
    // Check if the travel record exists and belongs to the user
    const travel = yield db_1.prismaClient.travel.findUnique({
        where: { id: Number(id) },
    });
    if (!travel) {
        throw new apiHandlerHelpers_1.ApiError(404, "Travel record not found");
    }
    if (travel.userId !== userId) {
        throw new apiHandlerHelpers_1.ApiError(403, "You are not authorized to update this travel record");
    }
    // Update status
    const updatedTravel = yield db_1.prismaClient.travel.update({
        where: { id: Number(id) },
        data: { status },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, updatedTravel, "Travel status updated successfully"));
}));
exports.deleteTravel = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Get authenticated user ID
    const isAdmin = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId; // Check if user is admin
    if (!userId) {
        throw new apiHandlerHelpers_1.ApiError(401, "Unauthorized");
    }
    // Find the travel record
    const travel = yield db_1.prismaClient.travel.findUnique({
        where: { id: Number(id) },
    });
    if (!travel) {
        throw new apiHandlerHelpers_1.ApiError(404, "Travel record not found");
    }
    // Check if the user is the owner or an admin
    if (travel.userId !== userId && !isAdmin) {
        throw new apiHandlerHelpers_1.ApiError(403, "You are not authorized to delete this travel record");
    }
    // Delete travel record
    yield db_1.prismaClient.travel.delete({
        where: { id: Number(id) },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {}, "Travel record deleted successfully"));
}));
