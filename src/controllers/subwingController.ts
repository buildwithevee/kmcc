import { Request, Response } from "express";
import sharp from "sharp";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse, ApiError } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";

export const createSubWing = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      backgroundColor = "#FFFFFF",
      mainColor = "#000000",
    } = req.body;

    if (!name) {
      throw new ApiError(400, "Sub-wing name is required.");
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (
      !hexColorRegex.test(backgroundColor) ||
      !hexColorRegex.test(mainColor)
    ) {
      throw new ApiError(
        400,
        "Invalid color format. Use hex codes like #FFFFFF or #FFF."
      );
    }

    let iconBuffer: Buffer | null = null;
    if (req.file) {
      if (req.file.mimetype !== "image/svg+xml") {
        throw new ApiError(400, "Only SVG files are allowed for the icon.");
      }
      iconBuffer = req.file.buffer;
    }

    await prismaClient.subWing.create({
      data: {
        name,
        icon: iconBuffer,
        backgroundColor,
        mainColor,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Sub-wing created successfully."));
  }
);

export const addSubWingMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, position } = req.body;
    const subWingId = Number(req.params.subWingId);

    if (!name || !position || isNaN(subWingId)) {
      throw new ApiError(
        400,
        "Name, position, and valid sub-wing ID are required."
      );
    }

    let imageBuffer: Buffer | null = null;
    if (req.file) {
      imageBuffer = await sharp(req.file.buffer)
        .resize(163, 231)
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    await prismaClient.subWingMember.create({
      data: {
        name,
        position,
        image: imageBuffer,
        subWingId,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Member added successfully."));
  }
);
const bufferToSvgDataUrl = (
  buffer: Buffer | Uint8Array | null
): string | null => {
  if (!buffer) return null;

  try {
    // First try UTF-8 URI encoding (works best for SVGs)
    try {
      const svgString =
        buffer instanceof Buffer
          ? buffer.toString("utf8")
          : new TextDecoder().decode(buffer);
      if (!svgString.includes("<svg") || !svgString.includes("</svg>")) {
        console.warn("Buffer does not contain valid SVG markup");
        throw new Error("Invalid SVG content");
      }
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svgString
      )}`;
    } catch (error) {
      const uriError = error as Error;
      console.log("Falling back to base64 encoding due to:", uriError.message);
      // Fallback to base64 if URI encoding fails
      const base64String =
        buffer instanceof Buffer
          ? buffer.toString("base64")
          : Buffer.from(buffer).toString("base64");
      return `data:image/svg+xml;base64,${base64String}`;
    }
  } catch (error) {
    console.error("Failed to convert icon buffer to data URL:", error);
    return null;
  }
};
// Add this to your subwingController.ts
export const deleteSubWingMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = Number(req.params.memberId);
    if (isNaN(memberId)) {
      throw new ApiError(400, "Invalid member ID.");
    }

    await prismaClient.subWingMember.delete({
      where: { id: memberId },
    });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Member deleted successfully."));
  }
);
// Add this to your subwingController.ts
export const updateSubWingMember = asyncHandler(
  async (req: Request, res: Response) => {
    const memberId = Number(req.params.memberId);
    const { name, position } = req.body;

    if (isNaN(memberId)) {
      throw new ApiError(400, "Invalid member ID.");
    }

    if (!name || !position) {
      throw new ApiError(400, "Name and position are required.");
    }

    let imageBuffer: Buffer | null = null;
    if (req.file) {
      imageBuffer = await sharp(req.file.buffer)
        .resize(163, 231)
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    const updateData: {
      name: string;
      position: string;
      image?: Buffer;
    } = {
      name,
      position,
    };

    if (imageBuffer) {
      updateData.image = imageBuffer;
    }

    const updatedMember = await prismaClient.subWingMember.update({
      where: { id: memberId },
      data: updateData,
    });

    res
      .status(200)
      .json(new ApiResponse(200, updatedMember, "Member updated successfully."));
  }
);
export const getAllSubWings = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Debug: Log the start of the operation
      console.log("[getAllSubWings] Fetching subwings from database");

      const subWings = await prismaClient.subWing.findMany({
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
        console.log(`[Subwing ${index + 1}] ID: ${sw.id}, Name: ${sw.name}`);
        console.log(
          `  Icon exists: ${!!sw.icon}, Type: ${sw.icon?.constructor?.name}`
        );
        if (sw.icon) {
          console.log(`  Icon length: ${sw.icon.length} bytes`);
          const buffer =
            sw.icon instanceof Buffer ? sw.icon : Buffer.from(sw.icon);
          console.log(
            `  First 20 bytes: ${buffer.subarray(0, 20).toString("hex")}`
          );
        }
      });

      const formattedSubWings = subWings.map((subWing) => {
        // Convert icon buffer to data URL
        const iconDataUrl = bufferToSvgDataUrl(subWing.icon);

        // Debug log conversion results
        if (subWing.icon && !iconDataUrl) {
          console.warn(
            `[getAllSubWings] Failed to convert icon for subwing ${subWing.id}`
          );
        }

        return {
          id: subWing.id,
          name: subWing.name,
          backgroundColor: subWing.backgroundColor,
          mainColor: subWing.mainColor,
          icon: iconDataUrl,
          memberCount: subWing._count.members,
          // Include debug info in development
          ...(process.env.NODE_ENV === "development" && {
            _debug: {
              iconBufferInfo: subWing.icon
                ? {
                    length: subWing.icon.length,
                    startsWith:
                      subWing.icon instanceof Buffer
                        ? subWing.icon.subarray(0, 20).toString("hex")
                        : Buffer.from(subWing.icon)
                            .subarray(0, 20)
                            .toString("hex"),
                  }
                : null,
            },
          }),
        };
      });

      // Debug: Log final output
      console.log("[getAllSubWings] Final response data:", {
        count: formattedSubWings.length,
        sampleItem:
          formattedSubWings.length > 0
            ? {
                ...formattedSubWings[0],
                icon: formattedSubWings[0].icon?.substring(0, 50) + "...",
              }
            : null,
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            formattedSubWings,
            "Sub-wings retrieved successfully."
          )
        );
    } catch (error) {
      console.error("[getAllSubWings] Critical error:", error);
      throw error; // Let the asyncHandler handle it
    }
  }
);
export const getSubWingMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const subWingId = Number(req.params.subWingId);
    if (isNaN(subWingId)) throw new ApiError(400, "Invalid sub-wing ID.");

    try {
      console.log(
        `[getSubWingMembers] Fetching members for subWingId: ${subWingId}`
      );

      const members = await prismaClient.subWingMember.findMany({
        where: { subWingId },
        orderBy: { position: "asc" },
      });

      console.log(`[getSubWingMembers] Found ${members.length} members`);

      const formattedMembers = members.map((member) => {
        let imageDataUrl = null;

        if (member.image) {
          try {
            // Handle both Buffer and Uint8Array cases
            const imageBuffer =
              member.image instanceof Buffer
                ? member.image
                : Buffer.from(member.image);

            imageDataUrl = `data:image/jpeg;base64,${imageBuffer.toString(
              "base64"
            )}`;

            // Debug log successful conversion
            console.log(`[Member ${member.id}] Image converted successfully`, {
              originalType: member.image.constructor.name,
              bufferLength: imageBuffer.length,
              dataUrlPrefix: imageDataUrl.substring(0, 30) + "...",
            });
          } catch (error) {
            console.error(
              `[Member ${member.id}] Failed to convert image:`,
              error
            );
          }
        }

        return {
          id: member.id,
          name: member.name,
          position: member.position,
          subWingId: member.subWingId,
          image: imageDataUrl,
          // Include debug info in development
          ...(process.env.NODE_ENV === "development" && {
            _debug: {
              imageBufferInfo: member.image
                ? {
                    type: member.image.constructor.name,
                    length: member.image.length,
                    startsWith:
                      member.image instanceof Buffer
                        ? member.image
                        : Buffer.from(member.image)
                            .subarray(0, 10)
                            .toString("hex"),
                  }
                : null,
            },
          }),
        };
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            formattedMembers,
            "Members retrieved successfully."
          )
        );
    } catch (error) {
      console.error("[getSubWingMembers] Critical error:", error);
      throw new ApiError(500, "Failed to retrieve members");
    }
  }
);

export const getSubWingDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const subWingId = Number(req.params.subWingId);
    if (isNaN(subWingId)) throw new ApiError(400, "Invalid sub-wing ID.");

    const subWing = await prismaClient.subWing.findUnique({
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
      throw new ApiError(404, "Sub-wing not found.");
    }

    const formattedSubWing = {
      ...subWing,
      icon:
        subWing.icon instanceof Buffer
          ? `data:image/svg+xml;base64,${subWing.icon.toString("base64")}`
          : null,
      members: subWing.members.map((member) => ({
        ...member,
        image:
          member.image instanceof Buffer
            ? `data:image/jpeg;base64,${member.image.toString("base64")}`
            : null,
      })),
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedSubWing,
          "Sub-wing details retrieved successfully."
        )
      );
  }
);

export const updateSubWing = asyncHandler(
  async (req: Request, res: Response) => {
    const subWingId = Number(req.params.subWingId);
    const { name, backgroundColor, mainColor } = req.body;

    if (isNaN(subWingId)) {
      throw new ApiError(400, "Invalid sub-wing ID.");
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (
      (backgroundColor && !hexColorRegex.test(backgroundColor)) ||
      (mainColor && !hexColorRegex.test(mainColor))
    ) {
      throw new ApiError(
        400,
        "Invalid color format. Use hex codes like #FFFFFF or #FFF."
      );
    }

    let iconBuffer: Buffer | null = null;
    if (req.file) {
      if (req.file.mimetype !== "image/svg+xml") {
        throw new ApiError(400, "Only SVG files are allowed for the icon.");
      }
      iconBuffer = req.file.buffer;
    }

    const updateData: {
      name?: string;
      icon?: Buffer | null;
      backgroundColor?: string;
      mainColor?: string;
    } = {};

    if (name) updateData.name = name;
    if (iconBuffer !== null) updateData.icon = iconBuffer;
    if (backgroundColor) updateData.backgroundColor = backgroundColor;
    if (mainColor) updateData.mainColor = mainColor;

    const updatedSubWing = await prismaClient.subWing.update({
      where: { id: subWingId },
      data: updateData,
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedSubWing, "Sub-wing updated successfully.")
      );
  }
);
