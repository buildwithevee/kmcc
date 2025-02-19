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
exports.deleteService = exports.updateService = exports.getServiceById = exports.getAllServices = exports.createService = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
// ✅ Create a Service
exports.createService = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, location, availableTime, availableDays, image } = req.body;
    if (!title || !location || !availableTime || !availableDays || !image) {
        throw new apiHandlerHelpers_1.ApiError(400, "All fields are required.");
    }
    const service = yield db_1.prismaClient.service.create({
        data: { title, location, availableTime, availableDays, image },
    });
    res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, service, "Service created successfully."));
}));
// ✅ Get All Services (Paginated)
exports.getAllServices = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { page, limit } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const services = yield db_1.prismaClient.service.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
    });
    const totalServices = yield db_1.prismaClient.service.count();
    const totalPages = Math.ceil(totalServices / pageSize);
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalServices,
        services
    }, "Service list retrieved successfully."));
}));
// ✅ Get Single Service
exports.getServiceById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid service ID.");
    const service = yield db_1.prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!service)
        throw new apiHandlerHelpers_1.ApiError(404, "Service not found.");
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, service, "Service retrieved successfully."));
}));
// ✅ Update Service
exports.updateService = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid service ID.");
    const { title, location, availableTime, availableDays, image } = req.body;
    const existingService = yield db_1.prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService)
        throw new apiHandlerHelpers_1.ApiError(404, "Service not found.");
    const updatedService = yield db_1.prismaClient.service.update({
        where: { id: serviceId },
        data: {
            title: title || existingService.title,
            location: location || existingService.location,
            availableTime: availableTime || existingService.availableTime,
            availableDays: availableDays || existingService.availableDays,
            image: image || existingService.image,
        },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, updatedService, "Service updated successfully."));
}));
// ✅ Delete Service
exports.deleteService = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid service ID.");
    const existingService = yield db_1.prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService)
        throw new apiHandlerHelpers_1.ApiError(404, "Service not found.");
    yield db_1.prismaClient.service.delete({ where: { id: serviceId } });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, null, "Service deleted successfully."));
}));
