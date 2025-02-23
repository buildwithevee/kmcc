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
    const { title, location, availableTime, availableDays } = req.body;

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

    const service = await prismaClient.service.create({
        data: {
            title,
            location,
            availableTime,
            availableDays,
            image: imageBuffer
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

    const services = await prismaClient.service.findMany({
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
            } catch (error) {
                console.error('Error converting image to base64:', error);
                imageData = null;
            }
        }
        return {
            ...service,
            image: imageData
        };
    });

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

    // Safely handle the image conversion
    let imageData = null;
    if (service.image && Buffer.isBuffer(service.image)) {
        try {
            imageData = `data:image/jpeg;base64,${service.image.toString('base64')}`;
        } catch (error) {
            console.error('Error converting image to base64:', error);
            imageData = null;
        }
    }

    res.status(200).json(new ApiResponse(200, {
        ...service,
        image: imageData
    }, "Service retrieved successfully."));
});

// ✅ Update Service
export const updateService = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const { title, location, availableTime, availableDays } = req.body;

    const existingService = await prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService) throw new ApiError(404, "Service not found.");

    let imageBuffer: any | null = existingService.image; // Keep existing image if no new file is uploaded

    if (req.file) {
        imageBuffer = await sharp(req.file.buffer)
            .resize(300, 300)
            .jpeg({ quality: 80 })
            .toBuffer();
    }

    const updatedService = await prismaClient.service.update({
        where: { id: serviceId },
        data: {
            title: title || existingService.title,
            location: location || existingService.location,
            availableTime: availableTime || existingService.availableTime,
            availableDays: availableDays || existingService.availableDays,
            image: imageBuffer,
        },
    });

    res.status(200).json(new ApiResponse(200, updatedService, "Service updated successfully."));
});

// ✅ Delete Service
export const deleteService = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const existingService = await prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService) throw new ApiError(404, "Service not found.");

    await prismaClient.service.delete({ where: { id: serviceId } });

    res.status(200).json(new ApiResponse(200, null, "Service deleted successfully."));
});

// ✅ Export Multer Middleware
export const uploadMiddleware = upload.single("image");
