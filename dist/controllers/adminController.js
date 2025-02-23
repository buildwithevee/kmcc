"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.deleteEvent = exports.getEventById = exports.updateEventImage = exports.getEvents = exports.markAttendance = exports.createEvent = exports.getBanner = exports.uploadBanner = exports.getAllMemberships = exports.uploadMiddleware = exports.uploadMembership = void 0;
const XLSX = __importStar(require("xlsx"));
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
const upload_1 = require("../helpers/upload");
const sharp_1 = __importDefault(require("sharp"));
// ✅ Controller for Importing Membership Data from Excel
exports.uploadMembership = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        throw new apiHandlerHelpers_1.ApiError(400, "No file uploaded");
    }
    // ✅ Read the Excel File
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // ✅ Convert Excel to JSON
    const membershipData = XLSX.utils.sheet_to_json(sheet);
    if (!membershipData.length) {
        throw new apiHandlerHelpers_1.ApiError(400, "Uploaded file is empty");
    }
    // ✅ Prepare Data for Bulk Insert (Correct Column Mapping)
    const bulkData = membershipData.map((row) => {
        var _a, _b;
        return ({
            memberId: (_a = row["Membership ID"]) === null || _a === void 0 ? void 0 : _a.toString(),
            iqamaNumber: (_b = row["Iqama No"]) === null || _b === void 0 ? void 0 : _b.toString(),
            name: row["Name of Member"],
            phoneNumber: row["Phone Number"] || null,
            status: row["Status"] || "active",
        });
    });
    console.log("length........................", bulkData.length);
    console.log("Extracted Data from Excel (First 5 Rows):", bulkData.slice(0, 5));
    const memberIds = new Set();
    const iqamaNumbers = new Set();
    let duplicateCount = 0;
    membershipData.forEach((row) => {
        var _a, _b;
        const memberId = (_a = row["Membership ID"]) === null || _a === void 0 ? void 0 : _a.toString();
        const iqamaNumber = (_b = row["Iqama No"]) === null || _b === void 0 ? void 0 : _b.toString();
        if (memberIds.has(memberId) || iqamaNumbers.has(iqamaNumber)) {
            duplicateCount++;
            console.log(`Duplicate Found: memberId=${memberId}, iqamaNumber=${iqamaNumber}`);
        }
        else {
            memberIds.add(memberId);
            iqamaNumbers.add(iqamaNumber);
        }
    });
    console.log(`Total Duplicates: ${duplicateCount}`);
    // ✅ Insert Data (Avoid Duplicates)
    yield Promise.all(bulkData.map((member) => __awaiter(void 0, void 0, void 0, function* () {
        if (!member.memberId || !member.iqamaNumber || !member.name) {
            return; // Skip invalid rows
        }
        const exists = yield db_1.prismaClient.membership.findFirst({
            where: {
                OR: [{ memberId: member.memberId }, { iqamaNumber: member.iqamaNumber }],
            },
        });
        if (!exists) {
            yield db_1.prismaClient.membership.create({ data: member });
        }
    })));
    return res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, null, "Membership data uploaded successfully"));
}));
// ✅ Multer Middleware
exports.uploadMiddleware = upload_1.upload.single("file");
exports.getAllMemberships = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const memberships = yield db_1.prismaClient.membership.findMany();
    return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, memberships, "Membership data fetched successfully"));
}));
exports.uploadBanner = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        throw new apiHandlerHelpers_1.ApiError(400, "No file uploaded");
    }
    // ✅ Compress image using Sharp (Resize & Convert to JPEG)
    const compressedImage = yield (0, sharp_1.default)(req.file.buffer)
        .resize(376, 388) // Adjust width & height (optional)
        .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
        .toBuffer();
    // Check if a banner already exists (optional)
    const existingBanner = yield db_1.prismaClient.banner.findFirst();
    if (existingBanner) {
        // ✅ Update the existing banner
        yield db_1.prismaClient.banner.update({
            where: { id: existingBanner.id },
            data: { image: compressedImage },
        });
        return res.json(new apiHandlerHelpers_1.ApiResponse(200, null, "Banner updated successfully"));
    }
    // ✅ Create new banner
    yield db_1.prismaClient.banner.create({ data: { image: compressedImage } });
    res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, null, "Banner uploaded successfully"));
}));
exports.getBanner = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const banner = yield db_1.prismaClient.banner.findFirst();
    if (!banner) {
        throw new apiHandlerHelpers_1.ApiError(404, "No banner found");
    }
    res.json({
        success: true,
        image: `data:image/jpeg;base64,${Buffer.from(banner.image).toString("base64")}`
    });
}));
exports.createEvent = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, eventDate, place, timing, highlights, eventType } = req.body;
    // ✅ Ensure highlights is always an array
    const highlightsData = Array.isArray(highlights)
        ? highlights
        : typeof highlights === "string"
            ? JSON.parse(highlights)
            : [];
    // ✅ Compress image before storing
    const imageBuffer = req.file
        ? yield (0, sharp_1.default)(req.file.buffer).resize(800).jpeg({ quality: 80 }).toBuffer()
        : null;
    const event = yield db_1.prismaClient.event.create({
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
    res.json(new apiHandlerHelpers_1.ApiResponse(201, { eventId: event.id }, "Event created successfully"));
}));
exports.markAttendance = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId, userId } = req.body;
    const updated = yield db_1.prismaClient.eventRegistration.updateMany({
        where: { eventId, userId },
        data: { isAttended: true },
    });
    if (updated.count === 0) {
        throw new apiHandlerHelpers_1.ApiError(404, "User not found in this event");
    }
    res.json(new apiHandlerHelpers_1.ApiResponse(200, null, "Attendance marked successfully"));
}));
exports.getEvents = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const totalEvents = yield db_1.prismaClient.event.count();
    const events = yield db_1.prismaClient.event.findMany({
        skip,
        take: limit,
        include: { registrations: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
    });
    // Convert binary images to base64 for response
    const eventsWithImages = events.map((event) => (Object.assign(Object.assign({}, event), { image: event.image ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}` : null })));
    res.json({
        success: true,
        totalEvents,
        currentPage: page,
        totalPages: Math.ceil(totalEvents / limit),
        data: eventsWithImages,
        message: "Events retrieved successfully",
    });
}));
exports.updateEventImage = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.body;
    if (!req.file) {
        throw new apiHandlerHelpers_1.ApiError(400, "No file uploaded");
    }
    const event = yield db_1.prismaClient.event.findUnique({ where: { id: Number(eventId) } });
    if (!event) {
        throw new apiHandlerHelpers_1.ApiError(404, "Event not found");
    }
    // ✅ Compress image using Sharp
    const compressedImage = yield (0, sharp_1.default)(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();
    // ✅ Update event image
    yield db_1.prismaClient.event.update({
        where: { id: Number(eventId) },
        data: { image: compressedImage },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, null, "Event image updated successfully"));
}));
exports.getEventById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params; // Get event ID from URL params
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: Number(eventId) },
        include: {
            registrations: {
                include: { user: true }, // Fetch registered users
            },
        },
    });
    if (!event) {
        throw new apiHandlerHelpers_1.ApiError(404, "Event not found");
    }
    // Convert image to Base64 if exists
    const eventWithImage = Object.assign(Object.assign({}, event), { image: event.image ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}` : null });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, eventWithImage, "Event retrieved successfully"));
}));
exports.deleteEvent = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    // ✅ Check if event exists
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: Number(eventId) },
    });
    if (!event) {
        throw new apiHandlerHelpers_1.ApiError(404, "Event not found");
    }
    // ✅ Delete event (Cascade removes all registrations automatically)
    yield db_1.prismaClient.event.delete({
        where: { id: Number(eventId) },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, null, "Event deleted successfully"));
}));
