import { Request, Response } from "express";
import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";

// ✅ Create an Exclusive Member
export const createExclusiveMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, position, priority } = req.body;

    // Validate required fields
    if (!name || !position) {
      throw new ApiError(400, "Name and position are required.");
    }

    let imageBuffer: Buffer | null = null;

    // Process image if uploaded
    if (req.file) {
      imageBuffer = await sharp(req.file.buffer)
        .resize(163, 231) // Resize to the specified resolution
        .jpeg({ quality: 80 }) // Compress image
        .toBuffer();
    }

    // Create the exclusive member
    const exclusiveMember = await prismaClient.exclusiveMember.create({
      data: {
        name,
        position,
        image: imageBuffer,
        priority: priority || 0, // Default priority is 0
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Exclusive member created successfully."));
  }
);

// ✅ Get All Exclusive Members (Paginated and Ordered by Priority)
export const getAllExclusiveMembers = asyncHandler(
  async (req: Request, res: Response) => {
    let { page, limit } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Fetch exclusive members with explicit selection, ordered by priority
    const exclusiveMembers = await prismaClient.exclusiveMember.findMany({
      skip,
      take: pageSize,
      orderBy: { priority: "asc" }, // Order by priority (ascending)
      select: {
        id: true,
        name: true,
        position: true,
        image: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert image Buffer to Base64 safely
    const formattedExclusiveMembers = exclusiveMembers.map((member) => ({
      ...member,
      image: member.image
        ? `data:image/jpeg;base64,${Buffer.from(member.image).toString("base64")}`
        : null,
    }));

    const totalMembers = await prismaClient.exclusiveMember.count();
    const totalPages = Math.ceil(totalMembers / pageSize);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          currentPage: pageNumber,
          totalPages,
          pageSize,
          totalMembers,
          exclusiveMembers: formattedExclusiveMembers,
        },
        "Exclusive member list retrieved successfully."
      )
    );
  }
);

// ✅ Update Exclusive Member Details (Including Priority)
export const updateExclusiveMemberDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = Number(req.params.id);
    if (isNaN(memberId)) throw new ApiError(400, "Invalid member ID.");

    const { name, position, priority } = req.body;

    // Check if the member exists
    const existingMember = await prismaClient.exclusiveMember.findUnique({
      where: { id: memberId },
    });
    if (!existingMember) throw new ApiError(404, "Exclusive member not found.");

    // Update the member (including priority)
    const updatedMember = await prismaClient.exclusiveMember.update({
      where: { id: memberId },
      data: {
        name: name?.trim() || existingMember.name,
        position: position?.trim() || existingMember.position,
        priority: priority !== undefined ? priority : existingMember.priority,
      },
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedMember,
          "Exclusive member details updated successfully."
        )
      );
  }
);

// ✅ Update Exclusive Member Image Only
export const updateExclusiveMemberImage = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = Number(req.params.id);
    if (isNaN(memberId)) throw new ApiError(400, "Invalid member ID.");

    // Check if the member exists
    const existingMember = await prismaClient.exclusiveMember.findUnique({
      where: { id: memberId },
    });
    if (!existingMember) throw new ApiError(404, "Exclusive member not found.");

    let imageBuffer: Buffer | null = null;

    // Process image if uploaded
    if (req.file) {
      imageBuffer = await sharp(req.file.buffer)
        .resize(163.03992265660187, 231.42804501913355) // Resize to the specified resolution
        .jpeg({ quality: 80 }) // Compress image
        .toBuffer();
    }

    // Update the member image
    const updatedMember = await prismaClient.exclusiveMember.update({
      where: { id: memberId },
      data: {
        image: imageBuffer,
      },
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedMember,
          "Exclusive member image updated successfully."
        )
      );
  }
);

// ✅ Delete Exclusive Member
export const deleteExclusiveMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = Number(req.params.id);
    if (isNaN(memberId)) throw new ApiError(400, "Invalid member ID.");

    // Directly attempt to delete without redundant lookup
    const deletedMember = await prismaClient.exclusiveMember
      .delete({ where: { id: memberId } })
      .catch(() => null);

    if (!deletedMember) throw new ApiError(404, "Exclusive member not found.");

    res
      .status(200)
      .json(new ApiResponse(200, null, "Exclusive member deleted successfully."));
  }
);
