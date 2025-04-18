import { Request, Response } from "express";
import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";

// Create Exclusive Member
// Update create and update methods to properly handle image uploads:

export const createExclusiveMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, position } = req.body;

    if (!name || !position) {
      throw new ApiError(400, "Name and position are required.");
    }

    // Debugging: Log file information
    console.log("Uploaded file:", req.file);

    if (!req.file) {
      throw new ApiError(400, "Image is required.");
    }

    try {
      const imageBuffer = await sharp(req.file.buffer)
        // .resize(300, 300)
        .jpeg({ quality: 80 })
        .toBuffer();

      const maxPriorityMember = await prismaClient.exclusiveMember.findFirst({
        orderBy: { priority: "desc" },
      });
      const newPriority = maxPriorityMember
        ? maxPriorityMember.priority + 1
        : 0;

      const member = await prismaClient.exclusiveMember.create({
        data: {
          name,
          position,
          image: imageBuffer,
          priority: newPriority,
        },
      });

      res
        .status(201)
        .json(new ApiResponse(201, member, "Member created successfully"));
    } catch (error) {
      console.error("Image processing error:", error);
      throw new ApiError(500, "Failed to process image");
    }
  }
);

export const updateExclusiveMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = parseInt(req.params.id);
    const { name, position } = req.body;

    if (isNaN(memberId)) {
      throw new ApiError(400, "Invalid member ID");
    }

    try {
      let updateData = {
        name,
        position,
      };

      if (req.file) {
        const imageBuffer = await sharp(req.file.buffer)
          // .resize(300, 300)
          .jpeg({ quality: 80 })
          .toBuffer();
        updateData?.image = imageBuffer;
      }

      const updatedMember = await prismaClient.exclusiveMember.update({
        where: { id: memberId },
        data: updateData,
      });

      res
        .status(200)
        .json(new ApiResponse(200, updatedMember, "Member updated"));
    } catch (error) {
      console.error("Update error:", error);
      throw new ApiError(500, "Failed to update member");
    }
  }
);

// Get All Members (Ordered by priority)
export const getAllExclusiveMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const members = await prismaClient.exclusiveMember.findMany({
      orderBy: { priority: "asc" },
      select: {
        id: true,
        name: true,
        position: true,
        image: true,
        priority: true,
        createdAt: true,
      },
    });

    const formattedMembers = members.map((member) => ({
      ...member,
      image: member.image
        ? `data:image/jpeg;base64,${Buffer.from(member.image).toString(
            "base64"
          )}`
        : null,
    }));

    res
      .status(200)
      .json(
        new ApiResponse(200, { members: formattedMembers }, "Members retrieved")
      );
  }
);
// Get Single Exclusive Member
export const getExclusiveMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      throw new ApiError(400, "Invalid member ID");
    }

    const member = await prismaClient.exclusiveMember.findUnique({
      where: { id: memberId },
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

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    const formattedMember = {
      ...member,
      image: member.image
        ? `data:image/jpeg;base64,${Buffer.from(member.image).toString(
            "base64"
          )}`
        : null,
    };

    res
      .status(200)
      .json(
        new ApiResponse(200, formattedMember, "Member retrieved successfully")
      );
  }
);
// // Update Member Details
// export const updateExclusiveMember = asyncHandler(
//   async (req: Request, res: Response) => {
//     const memberId = parseInt(req.params.id);
//     const { name, position } = req.body;

//     if (isNaN(memberId)) {
//       throw new ApiError(400, "Invalid member ID");
//     }

//     let imageBuffer;
//     if (req.file) {
//       imageBuffer = await sharp(req.file.buffer)
//         .resize(300, 300)
//         .jpeg({ quality: 80 })
//         .toBuffer();
//     }

//     const updatedMember = await prismaClient.exclusiveMember.update({
//       where: { id: memberId },
//       data: {
//         name,
//         position,
//         ...(imageBuffer && { image: imageBuffer }),
//       },
//     });

//     res.status(200).json(new ApiResponse(200, updatedMember, "Member updated"));
//   }
// );

// Reorder Members
export const reorderExclusiveMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds)) {
      throw new ApiError(400, "Member IDs array required");
    }

    await prismaClient.$transaction(
      memberIds.map((id, index) =>
        prismaClient.exclusiveMember.update({
          where: { id },
          data: { priority: index },
        })
      )
    );

    res.status(200).json(new ApiResponse(200, {}, "Members reordered"));
  }
);

// Delete Member
export const deleteExclusiveMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      throw new ApiError(400, "Invalid member ID");
    }

    await prismaClient.exclusiveMember.delete({ where: { id: memberId } });

    // Recalculate priorities for remaining members
    const remainingMembers = await prismaClient.exclusiveMember.findMany({
      orderBy: { priority: "asc" },
    });

    await prismaClient.$transaction(
      remainingMembers.map((member, index) =>
        prismaClient.exclusiveMember.update({
          where: { id: member.id },
          data: { priority: index },
        })
      )
    );

    res.status(200).json(new ApiResponse(200, null, "Member deleted"));
  }
);
