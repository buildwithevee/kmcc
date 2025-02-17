import { Request, Response } from "express";

import * as XLSX from "xlsx";

import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiResponse } from "@/utils/apiHandlerHelpers";
import { prismaClient } from "@/config/db";
import { upload } from "@/helpers/upload";
import sharp from "sharp";



// ✅ Controller for Importing Membership Data from Excel
export const uploadMembership = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    // ✅ Read the Excel File
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // ✅ Convert Excel to JSON
    const membershipData = XLSX.utils.sheet_to_json(sheet);

    if (!membershipData.length) {
        throw new ApiError(400, "Uploaded file is empty");
    }

    // ✅ Prepare Data for Bulk Insert (Correct Column Mapping)
    const bulkData = membershipData.map((row: any) => ({
        memberId: row["Membership ID"]?.toString(),
        iqamaNumber: row["Iqama No"]?.toString(),
        name: row["Name of Member"],
        phoneNumber: row["Phone Number"] || null,
        status: row["Status"] || "active",
    }));
    console.log("length........................", bulkData.length,);
    console.log("Extracted Data from Excel (First 5 Rows):", bulkData.slice(0, 5));

    const memberIds = new Set();
    const iqamaNumbers = new Set();
    let duplicateCount = 0;

    membershipData.forEach((row: any) => {
        const memberId = row["Membership ID"]?.toString();
        const iqamaNumber = row["Iqama No"]?.toString();

        if (memberIds.has(memberId) || iqamaNumbers.has(iqamaNumber)) {
            duplicateCount++;
            console.log(`Duplicate Found: memberId=${memberId}, iqamaNumber=${iqamaNumber}`);
        } else {
            memberIds.add(memberId);
            iqamaNumbers.add(iqamaNumber);
        }
    });

    console.log(`Total Duplicates: ${duplicateCount}`);

    // ✅ Insert Data (Avoid Duplicates)
    await Promise.all(
        bulkData.map(async (member) => {
            if (!member.memberId || !member.iqamaNumber || !member.name) {
                return; // Skip invalid rows
            }

            const exists = await prismaClient.membership.findFirst({
                where: {
                    OR: [{ memberId: member.memberId }, { iqamaNumber: member.iqamaNumber }],
                },
            });

            if (!exists) {
                await prismaClient.membership.create({ data: member });
            }
        })
    );

    return res.status(201).json(new ApiResponse(201, null, "Membership data uploaded successfully"));
});

// ✅ Multer Middleware
export const uploadMiddleware = upload.single("file");


export const getAllMemberships = asyncHandler(async (req: Request, res: Response) => {
    const memberships = await prismaClient.membership.findMany();
    return res.status(200).json(new ApiResponse(200, memberships, "Membership data fetched successfully"));
});


export const uploadBanner = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    // ✅ Compress image using Sharp (Resize & Convert to JPEG)
    const compressedImage = await sharp(req.file.buffer)
        .resize(1200, 600) // Adjust width & height (optional)
        .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
        .toBuffer();

    // Check if a banner already exists (optional)
    const existingBanner = await prismaClient.banner.findFirst();
    if (existingBanner) {
        // ✅ Update the existing banner
        await prismaClient.banner.update({
            where: { id: existingBanner.id },
            data: { image: compressedImage },
        });

        return res.json(new ApiResponse(200, null, "Banner updated successfully"));
    }

    // ✅ Create new banner
    await prismaClient.banner.create({ data: { image: compressedImage } });

    res.status(201).json(new ApiResponse(201, null, "Banner uploaded successfully"));
});

export const getBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await prismaClient.banner.findFirst();
    if (!banner) {
        throw new ApiError(404, "No banner found");
    }

    res.json({
        success: true,
        image: `data:image/jpeg;base64,${Buffer.from(banner.image).toString("base64")}`
    });
});


export const createEvent = asyncHandler(async (req: Request, res: Response) => {
    const { title, eventDate, place, timing, highlights, eventType } = req.body;

    // ✅ Ensure highlights is always an array
    const highlightsData = Array.isArray(highlights)
        ? highlights
        : typeof highlights === "string"
            ? JSON.parse(highlights)
            : [];

    // ✅ Compress image before storing
    const imageBuffer = req.file
        ? await sharp(req.file.buffer).resize(800).jpeg({ quality: 80 }).toBuffer()
        : null;

    const event = await prismaClient.event.create({
        data: {
            title,
            eventDate: new Date(eventDate),
            place,
            timing,
            highlights: highlightsData, // ✅ No JSON.stringify()
            eventType,
            image: imageBuffer,
        },
        select: { id: true }, // ✅ Return only event ID
    });

    res.json(new ApiResponse(201, { eventId: event.id }, "Event created successfully"));
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
    const { eventId, userId } = req.body;

    const updated = await prismaClient.eventRegistration.updateMany({
        where: { eventId, userId },
        data: { isAttended: true },
    });

    if (updated.count === 0) {
        throw new ApiError(404, "User not found in this event");
    }

    res.json(new ApiResponse(200, null, "Attendance marked successfully"));
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalEvents = await prismaClient.event.count();

    const events = await prismaClient.event.findMany({
        skip,
        take: limit,
        include: { registrations: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
    });

    // Convert binary images to base64 for response
    const eventsWithImages = events.map((event) => ({
        ...event,
        image: event.image ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}` : null,
    }));

    res.json({
        success: true,
        totalEvents,
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        data: eventsWithImages,
        message: "Events retrieved successfully",
    });
});

export const updateEventImage = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.body;

    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    const event = await prismaClient.event.findUnique({ where: { id: Number(eventId) } });
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // ✅ Compress image using Sharp
    const compressedImage = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

    // ✅ Update event image
    await prismaClient.event.update({
        where: { id: Number(eventId) },
        data: { image: compressedImage },
    });

    res.json(new ApiResponse(200, null, "Event image updated successfully"));
});


export const getEventById = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params; // Get event ID from URL params

    const event = await prismaClient.event.findUnique({
        where: { id: Number(eventId) },
        include: {
            registrations: {
                include: { user: true }, // Fetch registered users
            },
        },
    });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Convert image to Base64 if exists
    const eventWithImage = {
        ...event,
        image: event.image ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}` : null,
    };

    res.json(new ApiResponse(200, eventWithImage, "Event retrieved successfully"));
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;

    // ✅ Check if event exists
    const event = await prismaClient.event.findUnique({
        where: { id: Number(eventId) },
    });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // ✅ Delete event (Cascade removes all registrations automatically)
    await prismaClient.event.delete({
        where: { id: Number(eventId) },
    });

    res.json(new ApiResponse(200, null, "Event deleted successfully"));
});
