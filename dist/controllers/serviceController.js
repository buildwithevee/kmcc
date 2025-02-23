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
exports.uploadMiddleware = exports.deleteService = exports.updateService = exports.getServiceById = exports.getAllServices = exports.createService = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
// Multer setup for handling image uploads
const storage = multer_1.default.memoryStorage(); // Store file in memory as Buffer
const upload = (0, multer_1.default)({ storage });
// ✅ Create a Service
exports.createService = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, location, availableTime, availableDays } = req.body;
    if (!title || !location || !availableTime || !availableDays) {
        throw new apiHandlerHelpers_1.ApiError(400, "All fields are required.");
    }
    let imageBuffer = null;
    if (req.file) {
        imageBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize(300, 300) // Resize to 300x300
            .jpeg({ quality: 80 }) // Compress image
            .toBuffer();
    }
    const service = yield db_1.prismaClient.service.create({
        data: {
            title,
            location,
            availableTime,
            availableDays,
            image: imageBuffer
        },
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
    // Safely convert Buffer to Base64 for frontend use
    const formattedServices = services.map((service) => {
        let imageData = null;
        if (service.image && Buffer.isBuffer(service.image)) {
            try {
                imageData = `data:image/jpeg;base64,${service.image.toString('base64')}`;
            }
            catch (error) {
                console.error('Error converting image to base64:', error);
                imageData = null;
            }
        }
        return Object.assign(Object.assign({}, service), { image: imageData });
    });
    const totalServices = yield db_1.prismaClient.service.count();
    const totalPages = Math.ceil(totalServices / pageSize);
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalServices,
        services: formattedServices
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
    // Safely handle the image conversion
    let imageData = null;
    if (service.image && Buffer.isBuffer(service.image)) {
        try {
            imageData = `data:image/jpeg;base64,${service.image.toString('base64')}`;
        }
        catch (error) {
            console.error('Error converting image to base64:', error);
            imageData = null;
        }
    }
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, Object.assign(Object.assign({}, service), { image: imageData }), "Service retrieved successfully."));
}));
// ✅ Update Service
exports.updateService = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid service ID.");
    const { title, location, availableTime, availableDays } = req.body;
    const existingService = yield db_1.prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService)
        throw new apiHandlerHelpers_1.ApiError(404, "Service not found.");
    let imageBuffer = existingService.image; // Keep existing image if no new file is uploaded
    if (req.file) {
        imageBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize(300, 300)
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    const updatedService = yield db_1.prismaClient.service.update({
        where: { id: serviceId },
        data: {
            title: title || existingService.title,
            location: location || existingService.location,
            availableTime: availableTime || existingService.availableTime,
            availableDays: availableDays || existingService.availableDays,
            image: imageBuffer,
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
// ✅ Export Multer Middleware
exports.uploadMiddleware = upload.single("image");
