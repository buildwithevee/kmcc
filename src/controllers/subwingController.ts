import { Request, Response } from "express";

import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";

// Multer setup for handling file uploads

// ✅ Create a Sub-Wing
export const createSubWing = asyncHandler(
  async (req: Request, res: Response) => {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      throw new ApiError(400, "Sub-wing name is required.");
    }

    let iconBuffer: Buffer | null = null;

    // Process SVG icon if uploaded
    if (req.file) {
      iconBuffer = req.file.buffer; // Store SVG as-is (no resizing or compression)
    }

    // Create the sub-wing in the database
    const subWing = await prismaClient.subWing.create({
      data: {
        name,
        icon: iconBuffer,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201,{}, "Sub-wing created successfully."));
  }
);

// ✅ Add a Member to a Sub-Wing
export const addSubWingMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, position } = req.body;
    const subWingId = Number(req.params.subWingId);

    // Validate required fields
    if (!name || !position || isNaN(subWingId)) {
      throw new ApiError(
        400,
        "Name, position, and valid sub-wing ID are required."
      );
    }

    let imageBuffer: Buffer | null = null;

    // Process image if uploaded
    if (req.file) {
      imageBuffer = await sharp(req.file.buffer)
        .resize(163, 231) // Resize to specified resolution (no decimals)
        .jpeg({ quality: 80 }) // Compress image
        .toBuffer();
    }

    // Create the sub-wing member in the database
    const member = await prismaClient.subWingMember.create({
      data: {
        name,
        position,
        image: imageBuffer,
        subWingId,
      },
    });

    res
      .status(201)
      .json(
        new ApiResponse(201, {}, "Sub-wing member added successfully.")
      );
  }
);
// ✅ Get All Sub-Wings (WITHOUT members)
export const getAllSubWings = asyncHandler(async (req: Request, res: Response) => {
    const subWings = await prismaClient.subWing.findMany();
  
    const formattedSubWings = subWings.map((subWing) => ({
      ...subWing,
      icon: subWing.icon
        ? `data:image/svg+xml;base64,${Buffer.from(subWing.icon).toString("base64")}`
        : null,
    }));
  
    res.status(200).json(new ApiResponse(200, formattedSubWings, "Sub-wings retrieved successfully."));
  });
  
  // ✅ Get Members of a Specific Sub-Wing
  export const getSubWingMembers = asyncHandler(async (req: Request, res: Response) => {
    const subWingId = Number(req.params.subWingId);
    if (isNaN(subWingId)) throw new ApiError(400, "Invalid sub-wing ID.");
  
    const members = await prismaClient.subWingMember.findMany({
      where: { subWingId },
      orderBy: { position: "asc" },
    });
  
    const formattedMembers = members.map((member) => ({
      ...member,
      image: member.image
        ? `data:image/jpeg;base64,${Buffer.from(member.image).toString("base64")}`
        : null,
    }));
  
    res.status(200).json(new ApiResponse(200, formattedMembers, "Sub-wing members retrieved successfully."));
  });