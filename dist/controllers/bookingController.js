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
exports.updateBookingStatus = exports.getServiceBookings = exports.bookService = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
// ✅ Book a Service
exports.bookService = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { serviceId, userId, date } = req.body;
    if (!serviceId || !userId || !date) {
        throw new apiHandlerHelpers_1.ApiError(400, "Service ID, User ID, and date are required.");
    }
    const booking = yield db_1.prismaClient.serviceBooking.create({
        data: { serviceId, userId, date, status: "pending" },
    });
    res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, booking, "Service booked successfully."));
}));
// ✅ Get Bookings for a Service
exports.getServiceBookings = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = Number(req.params.serviceId);
    if (isNaN(serviceId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid service ID.");
    const bookings = yield db_1.prismaClient.serviceBooking.findMany({ where: { serviceId } });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, bookings, "Bookings retrieved successfully."));
}));
// ✅ Update Booking Status
exports.updateBookingStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bookingId = Number(req.params.id);
    const { status } = req.body;
    if (isNaN(bookingId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid booking ID.");
    if (!status)
        throw new apiHandlerHelpers_1.ApiError(400, "Status is required.");
    const booking = yield db_1.prismaClient.serviceBooking.update({
        where: { id: bookingId },
        data: { status },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, booking, "Booking status updated successfully."));
}));
