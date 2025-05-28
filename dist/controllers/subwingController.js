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
exports.updateSubWing = exports.getSubWingDetails = exports.getSubWingMembers = exports.getAllSubWings = exports.updateSubWingMember = exports.deleteSubWingMember = exports.addSubWingMember = exports.createSubWing = void 0;
const sharp_1 = __importDefault(require("sharp"));
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
exports.createSubWing = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, backgroundColor = "#FFFFFF", mainColor = "#000000", } = req.body;
    if (!name) {
        throw new apiHandlerHelpers_1.ApiError(400, "Sub-wing name is required.");
    }
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(backgroundColor) ||
        !hexColorRegex.test(mainColor)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid color format. Use hex codes like #FFFFFF or #FFF.");
    }
    let iconBuffer = null;
    if (req.file) {
        if (req.file.mimetype !== "image/svg+xml") {
            throw new apiHandlerHelpers_1.ApiError(400, "Only SVG files are allowed for the icon.");
        }
        iconBuffer = req.file.buffer;
    }
    yield db_1.prismaClient.subWing.create({
        data: {
            name,
            icon: iconBuffer,
            backgroundColor,
            mainColor,
        },
    });
    res
        .status(201)
        .json(new apiHandlerHelpers_1.ApiResponse(201, {}, "Sub-wing created successfully."));
}));
exports.addSubWingMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, position } = req.body;
    const subWingId = Number(req.params.subWingId);
    if (!name || !position || isNaN(subWingId)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Name, position, and valid sub-wing ID are required.");
    }
    let imageBuffer = null;
    if (req.file) {
        imageBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize(163, 231)
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    yield db_1.prismaClient.subWingMember.create({
        data: {
            name,
            position,
            image: imageBuffer,
            subWingId,
        },
    });
    res
        .status(201)
        .json(new apiHandlerHelpers_1.ApiResponse(201, {}, "Member added successfully."));
}));
const bufferToSvgDataUrl = (buffer) => {
    if (!buffer)
        return null;
    try {
        // First try UTF-8 URI encoding (works best for SVGs)
        try {
            const svgString = buffer instanceof Buffer
                ? buffer.toString("utf8")
                : new TextDecoder().decode(buffer);
            if (!svgString.includes("<svg") || !svgString.includes("</svg>")) {
                console.warn("Buffer does not contain valid SVG markup");
                throw new Error("Invalid SVG content");
            }
            return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        }
        catch (error) {
            const uriError = error;
            console.log("Falling back to base64 encoding due to:", uriError.message);
            // Fallback to base64 if URI encoding fails
            const base64String = buffer instanceof Buffer
                ? buffer.toString("base64")
                : Buffer.from(buffer).toString("base64");
            return `data:image/svg+xml;base64,${base64String}`;
        }
    }
    catch (error) {
        console.error("Failed to convert icon buffer to data URL:", error);
        return null;
    }
};
// Add this to your subwingController.ts
exports.deleteSubWingMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const memberId = Number(req.params.memberId);
    if (isNaN(memberId)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid member ID.");
    }
    yield db_1.prismaClient.subWingMember.delete({
        where: { id: memberId },
    });
    res
        .status(200)
        .json(new apiHandlerHelpers_1.ApiResponse(200, {}, "Member deleted successfully."));
}));
// Add this to your subwingController.ts
exports.updateSubWingMember = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const memberId = Number(req.params.memberId);
    const { name, position } = req.body;
    if (isNaN(memberId)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid member ID.");
    }
    if (!name || !position) {
        throw new apiHandlerHelpers_1.ApiError(400, "Name and position are required.");
    }
    let imageBuffer = null;
    if (req.file) {
        imageBuffer = yield (0, sharp_1.default)(req.file.buffer)
            .resize(163, 231)
            .jpeg({ quality: 80 })
            .toBuffer();
    }
    const updateData = {
        name,
        position,
    };
    if (imageBuffer) {
        updateData.image = imageBuffer;
    }
    const updatedMember = yield db_1.prismaClient.subWingMember.update({
        where: { id: memberId },
        data: updateData,
    });
    res
        .status(200)
        .json(new apiHandlerHelpers_1.ApiResponse(200, updatedMember, "Member updated successfully."));
}));
exports.getAllSubWings = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Debug: Log the start of the operation
        console.log("[getAllSubWings] Fetching subwings from database");
        const subWings = yield db_1.prismaClient.subWing.findMany({
            select: {
                id: true,
                name: true,
                backgroundColor: true,
                mainColor: true,
                icon: true,
                _count: {
                    select: { members: true },
                },
            },
        });
        // Debug: Log raw database results
        console.log(`[getAllSubWings] Found ${subWings.length} subwings`);
        subWings.forEach((sw, index) => {
            var _a, _b;
            console.log(`[Subwing ${index + 1}] ID: ${sw.id}, Name: ${sw.name}`);
            console.log(`  Icon exists: ${!!sw.icon}, Type: ${(_b = (_a = sw.icon) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name}`);
            if (sw.icon) {
                console.log(`  Icon length: ${sw.icon.length} bytes`);
                const buffer = sw.icon instanceof Buffer ? sw.icon : Buffer.from(sw.icon);
                console.log(`  First 20 bytes: ${buffer.subarray(0, 20).toString("hex")}`);
            }
        });
        const formattedSubWings = subWings.map((subWing) => {
            // Convert icon buffer to data URL
            const iconDataUrl = bufferToSvgDataUrl(subWing.icon);
            // Debug log conversion results
            if (subWing.icon && !iconDataUrl) {
                console.warn(`[getAllSubWings] Failed to convert icon for subwing ${subWing.id}`);
            }
            return Object.assign({ id: subWing.id, name: subWing.name, backgroundColor: subWing.backgroundColor, mainColor: subWing.mainColor, icon: iconDataUrl, memberCount: subWing._count.members }, (process.env.NODE_ENV === "development" && {
                _debug: {
                    iconBufferInfo: subWing.icon
                        ? {
                            length: subWing.icon.length,
                            startsWith: subWing.icon instanceof Buffer
                                ? subWing.icon.subarray(0, 20).toString("hex")
                                : Buffer.from(subWing.icon)
                                    .subarray(0, 20)
                                    .toString("hex"),
                        }
                        : null,
                },
            }));
        });
        // Debug: Log final output
        console.log("[getAllSubWings] Final response data:", {
            count: formattedSubWings.length,
            sampleItem: formattedSubWings.length > 0
                ? Object.assign(Object.assign({}, formattedSubWings[0]), { icon: ((_a = formattedSubWings[0].icon) === null || _a === void 0 ? void 0 : _a.substring(0, 50)) + "..." }) : null,
        });
        res
            .status(200)
            .json(new apiHandlerHelpers_1.ApiResponse(200, formattedSubWings, "Sub-wings retrieved successfully."));
    }
    catch (error) {
        console.error("[getAllSubWings] Critical error:", error);
        throw error; // Let the asyncHandler handle it
    }
}));
exports.getSubWingMembers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subWingId = Number(req.params.subWingId);
    if (isNaN(subWingId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid sub-wing ID.");
    try {
        console.log(`[getSubWingMembers] Fetching members for subWingId: ${subWingId}`);
        const members = yield db_1.prismaClient.subWingMember.findMany({
            where: { subWingId },
            orderBy: { position: "asc" },
        });
        console.log(`[getSubWingMembers] Found ${members.length} members`);
        const formattedMembers = members.map((member) => {
            let imageDataUrl = null;
            if (member.image) {
                try {
                    // Handle both Buffer and Uint8Array cases
                    const imageBuffer = member.image instanceof Buffer
                        ? member.image
                        : Buffer.from(member.image);
                    imageDataUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
                    // Debug log successful conversion
                    console.log(`[Member ${member.id}] Image converted successfully`, {
                        originalType: member.image.constructor.name,
                        bufferLength: imageBuffer.length,
                        dataUrlPrefix: imageDataUrl.substring(0, 30) + "...",
                    });
                }
                catch (error) {
                    console.error(`[Member ${member.id}] Failed to convert image:`, error);
                }
            }
            return Object.assign({ id: member.id, name: member.name, position: member.position, subWingId: member.subWingId, image: imageDataUrl }, (process.env.NODE_ENV === "development" && {
                _debug: {
                    imageBufferInfo: member.image
                        ? {
                            type: member.image.constructor.name,
                            length: member.image.length,
                            startsWith: member.image instanceof Buffer
                                ? member.image
                                : Buffer.from(member.image)
                                    .subarray(0, 10)
                                    .toString("hex"),
                        }
                        : null,
                },
            }));
        });
        res
            .status(200)
            .json(new apiHandlerHelpers_1.ApiResponse(200, formattedMembers, "Members retrieved successfully."));
    }
    catch (error) {
        console.error("[getSubWingMembers] Critical error:", error);
        throw new apiHandlerHelpers_1.ApiError(500, "Failed to retrieve members");
    }
}));
exports.getSubWingDetails = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subWingId = Number(req.params.subWingId);
    if (isNaN(subWingId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid sub-wing ID.");
    const subWing = yield db_1.prismaClient.subWing.findUnique({
        where: { id: subWingId },
        include: {
            members: {
                orderBy: { position: "asc" },
                select: {
                    id: true,
                    name: true,
                    position: true,
                    image: true,
                },
            },
        },
    });
    if (!subWing) {
        throw new apiHandlerHelpers_1.ApiError(404, "Sub-wing not found.");
    }
    const formattedSubWing = Object.assign(Object.assign({}, subWing), { icon: subWing.icon instanceof Buffer
            ? `data:image/svg+xml;base64,${subWing.icon.toString("base64")}`
            : null, members: subWing.members.map((member) => (Object.assign(Object.assign({}, member), { image: member.image instanceof Buffer
                ? `data:image/jpeg;base64,${member.image.toString("base64")}`
                : null }))) });
    res
        .status(200)
        .json(new apiHandlerHelpers_1.ApiResponse(200, formattedSubWing, "Sub-wing details retrieved successfully."));
}));
exports.updateSubWing = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const subWingId = Number(req.params.subWingId);
    const { name, backgroundColor, mainColor } = req.body;
    if (isNaN(subWingId)) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid sub-wing ID.");
    }
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if ((backgroundColor && !hexColorRegex.test(backgroundColor)) ||
        (mainColor && !hexColorRegex.test(mainColor))) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid color format. Use hex codes like #FFFFFF or #FFF.");
    }
    let iconBuffer = null;
    if (req.file) {
        if (req.file.mimetype !== "image/svg+xml") {
            throw new apiHandlerHelpers_1.ApiError(400, "Only SVG files are allowed for the icon.");
        }
        iconBuffer = req.file.buffer;
    }
    const updateData = {};
    if (name)
        updateData.name = name;
    if (iconBuffer !== null)
        updateData.icon = iconBuffer;
    if (backgroundColor)
        updateData.backgroundColor = backgroundColor;
    if (mainColor)
        updateData.mainColor = mainColor;
    const updatedSubWing = yield db_1.prismaClient.subWing.update({
        where: { id: subWingId },
        data: updateData,
    });
    res
        .status(200)
        .json(new apiHandlerHelpers_1.ApiResponse(200, updatedSubWing, "Sub-wing updated successfully."));
}));
