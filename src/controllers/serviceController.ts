import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse, ApiError } from "@/utils/apiHandlerHelpers";
import { prismaClient } from "@/config/db";

// ✅ Create a Service
export const createService = asyncHandler(async (req: Request, res: Response) => {
    const { title, location, availableTime, availableDays, image } = req.body;

    if (!title || !location || !availableTime || !availableDays || !image) {
        throw new ApiError(400, "All fields are required.");
    }

    const service = await prismaClient.service.create({
        data: { title, location, availableTime, availableDays, image },
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

    const totalServices = await prismaClient.service.count();
    const totalPages = Math.ceil(totalServices / pageSize);

    res.status(200).json(new ApiResponse(200, {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalServices,
        services
    }, "Service list retrieved successfully."));
});

// ✅ Get Single Service
export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const service = await prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new ApiError(404, "Service not found.");

    res.status(200).json(new ApiResponse(200, service, "Service retrieved successfully."));
});

// ✅ Update Service
export const updateService = asyncHandler(async (req: Request, res: Response) => {
    const serviceId = Number(req.params.id);
    if (isNaN(serviceId)) throw new ApiError(400, "Invalid service ID.");

    const { title, location, availableTime, availableDays, image } = req.body;

    const existingService = await prismaClient.service.findUnique({ where: { id: serviceId } });
    if (!existingService) throw new ApiError(404, "Service not found.");

    const updatedService = await prismaClient.service.update({
        where: { id: serviceId },
        data: {
            title: title || existingService.title,
            location: location || existingService.location,
            availableTime: availableTime || existingService.availableTime,
            availableDays: availableDays || existingService.availableDays,
            image: image || existingService.image,
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
