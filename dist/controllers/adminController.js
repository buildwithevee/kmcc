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
exports.downloadEventRegistrations = exports.updateUserWithProfile = exports.deleteUser = exports.getStats = exports.getUserById = exports.getAllUsers = exports.updateEventStatus = exports.deleteEvent = exports.getEventById = exports.updateEventImage = exports.getEvents = exports.markAttendance = exports.getEventRegistrations = exports.updateEvent = exports.createEvent = exports.getBanner = exports.uploadBanner = exports.editMembership = exports.addMembershipManually = exports.getAllMemberships = exports.uploadMiddleware = exports.upload = exports.getMembershipById = exports.uploadMembership = void 0;
const XLSX = __importStar(require("xlsx"));
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// ✅ Controller for Importing Membership Data from Excel
exports.uploadMembership = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("here");
    if (!req.file) {
        console.log("this");
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
            areaName: row["Area or Mandalam Name"] || null, // Added the new field
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
                OR: [
                    { memberId: member.memberId },
                    { iqamaNumber: member.iqamaNumber },
                ],
            },
        });
        if (!exists) {
            yield db_1.prismaClient.membership.create({ data: member });
        }
    })));
    return res
        .status(201)
        .json(new apiHandlerHelpers_1.ApiResponse(201, null, "Membership data uploaded successfully"));
}));
// Controller for getting a single membership by ID
exports.getMembershipById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Convert string ID to number
    const membershipId = parseInt(id);
    if (isNaN(membershipId)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid membership ID");
    }
    // Find the membership
    const membership = yield db_1.prismaClient.membership.findUnique({
        where: { id: membershipId },
    });
    if (!membership) {
        throw new apiHandlerHelpers_1.ApiError(404, "Membership not found");
    }
    return res
        .status(200)
        .json(new apiHandlerHelpers_1.ApiResponse(200, membership, "Membership retrieved successfully"));
}));
const storage = multer_1.default.memoryStorage(); // use memory for buffer
exports.upload = (0, multer_1.default)({ storage });
// ✅ Multer Middleware
exports.uploadMiddleware = exports.upload.single("file");
exports.getAllMemberships = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract pagination and search parameters from query
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const limit = parseInt(req.query.limit) || 10; // Default limit is 10
    const skip = (page - 1) * limit; // Calculate skip value
    const search = req.query.search || ""; // Search term
    // Build the search filter for MySQL
    const searchFilter = search
        ? {
            OR: [
                { memberId: { contains: search } },
                { iqamaNumber: { contains: search } },
                { name: { contains: search } },
                { phoneNumber: { contains: search } },
                { areaName: { contains: search } },
            ],
        }
        : {};
    // Fetch memberships with pagination and search filter
    const memberships = yield db_1.prismaClient.membership.findMany({
        where: searchFilter,
        skip: skip,
        take: limit,
    });
    // Get total count of memberships for pagination metadata
    const totalCount = yield db_1.prismaClient.membership.count({
        where: searchFilter,
    });
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    // Return response with pagination metadata
    return res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {
        memberships,
        pagination: {
            page,
            limit,
            totalCount,
            totalPages,
        },
    }, "Membership data fetched successfully"));
}));
exports.addMembershipManually = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { memberId, iqamaNumber, name, phoneNumber, status, areaName } = req.body;
    // Validate required fields
    if (!memberId || !iqamaNumber || !name) {
        throw new apiHandlerHelpers_1.ApiError(400, "memberId, iqamaNumber, and name are required.");
    }
    // Check for duplicates
    const existingMember = yield db_1.prismaClient.membership.findFirst({
        where: {
            OR: [{ memberId }, { iqamaNumber }],
        },
    });
    if (existingMember) {
        throw new apiHandlerHelpers_1.ApiError(400, "Member with the same memberId or iqamaNumber already exists.");
    }
    // Create new membership
    const newMember = yield db_1.prismaClient.membership.create({
        data: {
            memberId,
            iqamaNumber,
            name,
            phoneNumber: phoneNumber || null,
            status: status || "active",
            areaName: areaName || null,
        },
    });
    return res
        .status(201)
        .json(new apiHandlerHelpers_1.ApiResponse(201, newMember, "Membership added successfully."));
}));
// Controller for editing membership
exports.editMembership = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { memberId, iqamaNumber, name, phoneNumber, status, areaName } = req.body;
    // Convert string ID to number
    const membershipId = parseInt(id);
    if (isNaN(membershipId)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid membership ID");
    }
    // Validate required fields
    if (!memberId || !iqamaNumber || !name) {
        throw new apiHandlerHelpers_1.ApiError(400, "memberId, iqamaNumber, and name are required.");
    }
    // Check if membership exists
    const existingMembership = yield db_1.prismaClient.membership.findUnique({
        where: { id: membershipId },
    });
    if (!existingMembership) {
        throw new apiHandlerHelpers_1.ApiError(404, "Membership not found.");
    }
    // Check for duplicates with other members (excluding current one)
    const duplicateCheck = yield db_1.prismaClient.membership.findFirst({
        where: {
            AND: [
                { id: { not: membershipId } }, // Exclude current membership
                {
                    OR: [{ memberId }, { iqamaNumber }],
                },
            ],
        },
    });
    if (duplicateCheck) {
        throw new apiHandlerHelpers_1.ApiError(400, "Another member with the same memberId or iqamaNumber already exists.");
    }
    // Update membership
    const updatedMember = yield db_1.prismaClient.membership.update({
        where: { id: membershipId },
        data: {
            memberId,
            iqamaNumber,
            name,
            phoneNumber: phoneNumber || null,
            status: status || "active",
            areaName: areaName || null,
        },
    });
    return res
        .status(200)
        .json(new apiHandlerHelpers_1.ApiResponse(200, updatedMember, "Membership updated successfully."));
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
    res
        .status(201)
        .json(new apiHandlerHelpers_1.ApiResponse(201, null, "Banner uploaded successfully"));
}));
exports.getBanner = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const banner = yield db_1.prismaClient.banner.findFirst();
    if (!banner) {
        throw new apiHandlerHelpers_1.ApiError(404, "No banner found");
    }
    res.json({
        success: true,
        image: `data:image/jpeg;base64,${Buffer.from(banner.image).toString("base64")}`,
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
exports.updateEvent = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const { title, eventDate, place, timing, highlights, eventType } = req.body;
    // Validate required fields
    if (!title || !eventDate || !place || !timing) {
        throw new apiHandlerHelpers_1.ApiError(400, "Missing required fields");
    }
    // Process highlights
    const highlightsData = Array.isArray(highlights)
        ? highlights
        : typeof highlights === "string"
            ? JSON.parse(highlights)
            : [];
    // Process image if exists
    let imageBuffer = null;
    if (req.file) {
        imageBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize(800)
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    // Build update data
    const updateData = Object.assign({ title, eventDate: new Date(eventDate), place,
        timing, highlights: highlightsData, eventType }, (imageBuffer && { image: imageBuffer }));
    // Update event
    const updatedEvent = yield db_1.prismaClient.event.update({
        where: { id: Number(eventId) },
        data: updateData,
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, updatedEvent, "Event updated successfully"));
}));
exports.getEventRegistrations = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const registrations = yield db_1.prismaClient.eventRegistration.findMany({
        where: { eventId: Number(eventId) },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    memberId: true,
                    phoneNumber: true,
                    profileImage: true,
                },
            },
        },
    });
    // Convert profile images to base64
    const formattedRegistrations = registrations.map((reg) => (Object.assign(Object.assign({}, reg), { user: Object.assign(Object.assign({}, reg.user), { profileImage: reg.user.profileImage
                ? Buffer.from(reg.user.profileImage).toString("base64")
                : null }) })));
    res.json(new apiHandlerHelpers_1.ApiResponse(200, { registrations: formattedRegistrations }, "Event registrations fetched successfully"));
}));
exports.markAttendance = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const { userId, isAttended } = req.body;
    // Find the specific registration using the composite key
    const registration = yield db_1.prismaClient.eventRegistration.findUnique({
        where: {
            eventId_userId: {
                eventId: Number(eventId),
                userId: Number(userId),
            },
        },
    });
    if (!registration) {
        throw new apiHandlerHelpers_1.ApiError(404, "Registration not found");
    }
    // Update the attendance status
    const updatedRegistration = yield db_1.prismaClient.eventRegistration.update({
        where: {
            eventId_userId: {
                eventId: Number(eventId),
                userId: Number(userId),
            },
        },
        data: {
            isAttended: Boolean(isAttended),
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    memberId: true,
                    phoneNumber: true,
                },
            },
        },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, updatedRegistration, "Attendance updated successfully"));
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
    const eventsWithImages = events.map((event) => (Object.assign(Object.assign({}, event), { image: event.image
            ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}`
            : null })));
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
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: Number(eventId) },
    });
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
    const { eventId } = req.params;
    // Fetch the requested event with registrations
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: Number(eventId) },
        include: {
            registrations: {
                include: { user: true },
            },
        },
    });
    if (!event) {
        throw new apiHandlerHelpers_1.ApiError(404, "Event not found");
    }
    // Fetch related events (excluding the current one)
    const relatedEvents = yield db_1.prismaClient.event.findMany({
        where: {
            NOT: { id: Number(eventId) }, // Exclude current event
            eventDate: { gte: new Date() }, // Only future events
            // Optional: Add more filters for better relevance
            // eventType: event.eventType, // Same type as main event
        },
        take: 3, // Limit to 3 related events
        orderBy: { eventDate: "asc" }, // Sort by nearest date
    });
    // Convert images to Base64 for both main and related events
    const eventWithImage = Object.assign(Object.assign({}, event), { image: event.image
            ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}`
            : null });
    const relatedEventsWithImages = relatedEvents.map((ev) => (Object.assign(Object.assign({}, ev), { image: ev.image
            ? `data:image/jpeg;base64,${Buffer.from(ev.image).toString("base64")}`
            : null })));
    res.json(new apiHandlerHelpers_1.ApiResponse(200, {
        event: eventWithImage,
        relatedEvents: relatedEventsWithImages,
    }, "Event retrieved successfully with related events"));
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
exports.updateEventStatus = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    // Validate eventId
    if (!eventId) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid event ID");
    }
    // Check if the event exists
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: Number(eventId) },
    });
    if (!event) {
        throw new apiHandlerHelpers_1.ApiError(404, "Event not found");
    }
    // Update the isFinished state
    const updatedEvent = yield db_1.prismaClient.event.update({
        where: { id: Number(eventId) },
        data: { isFinished: true },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, updatedEvent, "Event status updated successfully"));
}));
// Get all users with pagination and searching
exports.getAllUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const searchQuery = search;
    const users = yield db_1.prismaClient.user.findMany({
        where: {
            OR: [
                { name: { contains: searchQuery } },
                { iqamaNumber: { contains: searchQuery } },
                { memberId: { contains: searchQuery } },
            ],
        },
        select: {
            id: true,
            name: true,
            iqamaNumber: true,
            memberId: true,
            phoneNumber: true,
            profileImage: true,
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
    });
    const totalUsers = yield db_1.prismaClient.user.count({
        where: {
            OR: [
                { name: { contains: searchQuery } },
                { iqamaNumber: { contains: searchQuery } },
                { memberId: { contains: searchQuery } },
            ],
        },
    });
    // Convert profile image to base64
    const formattedUsers = users.map((user) => (Object.assign(Object.assign({}, user), { profileImage: user.profileImage
            ? Buffer.from(user.profileImage).toString("base64")
            : null })));
    console.log(users, "users");
    res.json(new apiHandlerHelpers_1.ApiResponse(200, {
        users: formattedUsers,
        pagination: {
            totalUsers,
            page: pageNumber,
            limit: pageSize,
            totalPages: Math.ceil(totalUsers / pageSize),
        },
    }, "Users fetched successfully"));
}));
// Get a single user by ID
exports.getUserById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = yield db_1.prismaClient.user.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            name: true,
            iqamaNumber: true,
            memberId: true,
            phoneNumber: true,
            profileImage: true,
            email: true,
            isAdmin: true,
            isSuperAdmin: true,
            createdAt: true,
            updatedAt: true,
            profile: true,
            contactInfo: true,
        },
    });
    if (!user) {
        return res.json(new apiHandlerHelpers_1.ApiError(404, "User not found"));
    }
    // Convert profile image to base64
    const formattedUser = Object.assign(Object.assign({}, user), { profileImage: user.profileImage
            ? Buffer.from(user.profileImage).toString("base64")
            : null });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, formattedUser, "User details fetched successfully"));
}));
exports.getStats = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch total number of users
    const totalUsers = yield db_1.prismaClient.user.count();
    // Fetch total number of memberships
    const totalMemberships = yield db_1.prismaClient.membership.count();
    // Return the stats
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {
        totalUsers,
        totalMemberships,
        userTrend: [10, 15, 30, 25, 40, 50, 60],
        membershipTrend: [5, 10, 15, 12, 20, 25, 28],
    }, "Stats fetched successfully."));
}));
exports.deleteUser = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    // const adminId = req.user?.id; // Assuming you have authentication middleware
    // 1. Validate input
    if (!userId) {
        return res
            .status(400)
            .json(new apiHandlerHelpers_1.ApiResponse(400, null, "User ID is required"));
    }
    // 2. Check if admin exists and has privileges
    // const admin = await prismaClient.user.findUnique({
    //   where: { id: adminId },
    //   select: { isAdmin: true, isSuperAdmin: true }
    // });
    // if (!admin || (!admin.isAdmin && !admin.isSuperAdmin)) {
    //   return res.status(403).json(new ApiResponse(403, null, 'Unauthorized: Admin privileges required'));
    // }
    // // 3. Prevent self-deletion
    // if (parseInt(userId) === adminId) {
    //   return res.status(400).json(new ApiResponse(400, null, 'Admins cannot delete themselves'));
    // }
    // 4. Check if user exists
    const userToDelete = yield db_1.prismaClient.user.findUnique({
        where: { id: parseInt(userId) },
    });
    if (!userToDelete) {
        return res.status(404).json(new apiHandlerHelpers_1.ApiResponse(404, null, "User not found"));
    }
    // // 5. Prevent deleting super admins (unless by another super admin)
    // if (userToDelete.isSuperAdmin && !admin.isSuperAdmin) {
    //   return res
    //     .status(403)
    //     .json(
    //       new ApiResponse(
    //         403,
    //         null,
    //         "Only super admins can delete other super admins"
    //       )
    //     );
    // }
    // 6. Perform deletion with transaction (handles related records)
    yield db_1.prismaClient.$transaction([
        // Delete all related records first
        db_1.prismaClient.userSurveyAnswer.deleteMany({
            where: { userId: parseInt(userId) },
        }),
        db_1.prismaClient.userSurvey.deleteMany({ where: { userId: parseInt(userId) } }),
        // Add other relations as needed...
        // Then delete the user
        db_1.prismaClient.user.delete({ where: { id: parseInt(userId) } }),
    ]);
    // 7. Return success response
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, null, "User deleted successfully"));
}));
// Add this new controller to your existing adminController file
exports.updateUserWithProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { 
    // User fields
    name, email, phoneNumber, isAdmin, isSuperAdmin, password, // Add password field
    // Profile fields
    occupation, employer, place, dateOfBirth, bloodGroup, kmccPosition, address, } = req.body;
    // Validate required fields
    if (!name || !phoneNumber) {
        throw new apiHandlerHelpers_1.ApiError(400, "Name and phone number are required");
    }
    // Check if user exists
    const existingUser = yield db_1.prismaClient.user.findUnique({
        where: { id: Number(id) },
        include: { profile: true },
    });
    if (!existingUser) {
        throw new apiHandlerHelpers_1.ApiError(404, "User not found");
    }
    // Process profile image if exists
    let profileImageBuffer = null;
    if (req.file) {
        profileImageBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize(800)
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
        hashedPassword = yield bcrypt_1.default.hash(password, 10);
    }
    // Update user and profile in a transaction
    const [updatedUser] = yield db_1.prismaClient.$transaction([
        db_1.prismaClient.user.update({
            where: { id: Number(id) },
            data: Object.assign(Object.assign({ name, email: email || null, phoneNumber, isAdmin: isAdmin === "true", isSuperAdmin: isSuperAdmin === "true" }, (profileImageBuffer && { profileImage: profileImageBuffer })), (hashedPassword && { password: hashedPassword })),
            include: { profile: true },
        }),
        db_1.prismaClient.profile.upsert({
            where: { userId: Number(id) },
            update: {
                occupation: occupation || null,
                employer: employer || null,
                place: place || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                bloodGroup: bloodGroup || null,
                kmccPosition: kmccPosition || null,
                address: address || null,
            },
            create: {
                userId: Number(id),
                occupation: occupation || null,
                employer: employer || null,
                place: place || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                bloodGroup: bloodGroup || null,
                kmccPosition: kmccPosition || null,
                address: address || null,
            },
        }),
    ]);
    // Fetch the updated profile separately to ensure we get all fields
    const updatedProfile = yield db_1.prismaClient.profile.findUnique({
        where: { userId: Number(id) },
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, {
        user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            isAdmin: updatedUser.isAdmin,
            isSuperAdmin: updatedUser.isSuperAdmin,
            profileImage: updatedUser.profileImage
                ? Buffer.from(updatedUser.profileImage).toString("base64")
                : null,
        },
        profile: updatedProfile,
    }, "User and profile updated successfully"));
}));
exports.downloadEventRegistrations = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { eventId } = req.params;
    const programId = parseInt(eventId);
    if (isNaN(programId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid event ID");
    // Get event details for filename
    const event = yield db_1.prismaClient.event.findUnique({
        where: { id: programId },
        select: { title: true },
    });
    // Get all registrations with user info
    const registrations = yield db_1.prismaClient.eventRegistration.findMany({
        where: { eventId: programId },
        include: {
            user: {
                select: {
                    name: true,
                    memberId: true,
                    phoneNumber: true,
                    email: true,
                    gender: true,
                    areaName: true,
                    profile: {
                        select: {
                            occupation: true,
                            employer: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    if (!registrations.length) {
        throw new apiHandlerHelpers_1.ApiError(404, "No registrations found for this event");
    }
    console.log(registrations);
    // Prepare Excel data
    const excelData = registrations.map((reg, index) => {
        var _a, _b;
        return ({
            "#": index + 1,
            Name: reg.user.name,
            "Member ID": reg.user.memberId,
            Phone: reg.user.phoneNumber,
            Email: reg.user.email || "N/A",
            Gender: reg.user.gender || "N/A",
            Occupation: ((_a = reg.user.profile) === null || _a === void 0 ? void 0 : _a.occupation) || "N/A",
            Employer: ((_b = reg.user.profile) === null || _b === void 0 ? void 0 : _b.employer) || "N/A",
            "Registration Date": reg.createdAt.toISOString().split("T")[0],
            "Attendance Status": reg.isAttended ? "Attended" : "Not Attended",
            Constituency: reg.user.areaName || "N/A",
        });
    });
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    // Set column widths
    worksheet["!cols"] = [
        { width: 5 }, // #
        { width: 25 }, // Name
        { width: 15 }, // Member ID
        { width: 15 }, // Phone
        { width: 25 }, // Email
        { width: 10 }, // Gender
        { width: 20 }, // Occupation
        { width: 20 }, // Employer
        { width: 15 }, // Registration Date
        { width: 15 }, // Attendance Status
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    // Generate Excel file buffer
    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });
    // Set response headers
    const filename = `event_registrations_${(event === null || event === void 0 ? void 0 : event.title.replace(/[^a-z0-9]/gi, "_")) || eventId}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(filename)}`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    // Send the Excel file
    res.send(buffer);
}));
