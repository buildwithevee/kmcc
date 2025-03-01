import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";

// Multer setup for handling image uploads
const storage = multer.memoryStorage(); // Store file in memory as Buffer
const upload = multer({ storage });

// ✅ Create a Service
export const createService = asyncHandler(async (req: Request, res: Response) => {
    const { title, location, availableTime, availableDays,phoneNumber } = req.body;

    if (!title || !location || !availableTime || !availableDays) {
        throw new ApiError(400, "All fields are required.");
    }

    let imageBuffer: Buffer | null = null;

    if (req.file) {
        imageBuffer = await sharp(req.file.buffer)
            .resize(300, 300) // Resize to 300x300
            .jpeg({ quality: 80 }) // Compress image
            .toBuffer();
                }
            // Ensure availableDays is stored as a JSON array
            const parsedAvailableDays = typeof availableDays === "string" ? JSON.parse(availableDays) : availableDays;

            const service = await prismaClient.service.create({
                data: {
                    title,
                    location,
                    availableTime,
                    availableDays: parsedAvailableDays, // Use parsed JSON array
                    image: imageBuffer,
                    phoneNumber
                },
            });

    res.status(201).json(new ApiResponse(201, service, "Service created successfully."));
});

// ✅ Get All Services (Paginated)
export const getAllServices = asyncHandler(async (req: Request, res: Response) => {
    let { page, limit } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Fetch services with explicit selection
    const services = await prismaClient.service.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            location: true,
            availableTime: true,
            availableDays: true,
            image: true, // Ensure image is selected
            createdAt: true,
            updatedAt: true,
            phoneNumber:true
        },
    });

    // Convert image Buffer to Base64 safely
    const formattedServices = services.map((service) => ({
        ...service,
        image: service.image
            ? `data:image/jpeg;base64,${Buffer.from(service.image).toString("base64")}`
            : null, // Ensure `null` is returned if no image
    }));

    const totalServices = await prismaClient.service.count();
    const totalPages = Math.ceil(totalServices / pageSize);

    res.status(200).json(new ApiResponse(200, {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalServices,
        services: formattedServices
    }, "Service list retrieved successfully."));
});

// ✅ Get Single Service
export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const service = await prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new ApiError(404, "Service not found.");

    // Convert image Buffer to Base64 safely
    const imageData = service.image
        ? `data:image/jpeg;base64,${Buffer.from(service.image).toString("base64")}`
        : null;

    res.status(200).json(new ApiResponse(200, { ...service, image: imageData }, "Service retrieved successfully."));
});

// ✅ Update Service
export const updateService = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const { title, location, availableTime, availableDays, phoneNumber } = req.body;

    const existingService = await prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService) throw new ApiError(404, "Service not found.");

    let imageBuffer: Buffer | null = existingService.image ? Buffer.from(existingService.image) : null;

    if (req.file) {
        imageBuffer = await sharp(req.file.buffer)
            .resize(300, 300)
            .jpeg({ quality: 80 })
            .toBuffer();
    }

    const updatedService = await prismaClient.service.update({
        where: { id: serviceId },
        data: {
            title: title?.trim() || existingService.title,
            location: location?.trim() || existingService.location,
            availableTime: availableTime || existingService.availableTime,
            availableDays: availableDays || existingService.availableDays,
            image: imageBuffer,
            phoneNumber: phoneNumber?.trim() || existingService.phoneNumber
        },
    });

    res.status(200).json(new ApiResponse(200, updatedService, "Service updated successfully."));
});


// ✅ Delete Service
export const deleteService = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    // Directly attempt to delete without redundant lookup
    const deletedService = await prismaClient.service.delete({ where: { id: serviceId } }).catch(() => null);
    
    if (!deletedService) throw new ApiError(404, "Service not found.");

    res.status(200).json(new ApiResponse(200, null, "Service deleted successfully."));
});

// ✅ Export Multer Middleware
export const uploadMiddleware = upload.single("image");
