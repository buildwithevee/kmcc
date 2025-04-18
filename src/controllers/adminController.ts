import { Request, Response } from "express";

import * as XLSX from "xlsx";

import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiResponse } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";
import { upload } from "../helpers/upload";
import sharp from "sharp";

// ✅ Controller for Importing Membership Data from Excel
export const uploadMembership = asyncHandler(
  async (req: Request, res: Response) => {
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
      areaName: row["Area or Mandalam Name"] || null, // Added the new field
    }));

    console.log("length........................", bulkData.length);
    console.log(
      "Extracted Data from Excel (First 5 Rows):",
      bulkData.slice(0, 5)
    );

    const memberIds = new Set();
    const iqamaNumbers = new Set();
    let duplicateCount = 0;

    membershipData.forEach((row: any) => {
      const memberId = row["Membership ID"]?.toString();
      const iqamaNumber = row["Iqama No"]?.toString();

      if (memberIds.has(memberId) || iqamaNumbers.has(iqamaNumber)) {
        duplicateCount++;
        console.log(
          `Duplicate Found: memberId=${memberId}, iqamaNumber=${iqamaNumber}`
        );
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
            OR: [
              { memberId: member.memberId },
              { iqamaNumber: member.iqamaNumber },
            ],
          },
        });

        if (!exists) {
          await prismaClient.membership.create({ data: member });
        }
      })
    );

    return res
      .status(201)
      .json(
        new ApiResponse(201, null, "Membership data uploaded successfully")
      );
  }
);
// Controller for getting a single membership by ID
export const getMembershipById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Convert string ID to number
    const membershipId = parseInt(id);
    if (isNaN(membershipId)) {
      throw new ApiError(400, "Invalid membership ID");
    }

    // Find the membership
    const membership = await prismaClient.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new ApiError(404, "Membership not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, membership, "Membership retrieved successfully")
      );
  }
);
// ✅ Multer Middleware
export const uploadMiddleware = upload.single("file");

export const getAllMemberships = asyncHandler(
  async (req: Request, res: Response) => {
    // Extract pagination and search parameters from query
    const page = parseInt(req.query.page as string) || 1; // Default page is 1
    const limit = parseInt(req.query.limit as string) || 10; // Default limit is 10
    const skip = (page - 1) * limit; // Calculate skip value
    const search = (req.query.search as string) || ""; // Search term

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
    const memberships = await prismaClient.membership.findMany({
      where: searchFilter,
      skip: skip,
      take: limit,
    });

    // Get total count of memberships for pagination metadata
    const totalCount = await prismaClient.membership.count({
      where: searchFilter,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Return response with pagination metadata
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          memberships,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
          },
        },
        "Membership data fetched successfully"
      )
    );
  }
);
export const addMembershipManually = asyncHandler(
  async (req: Request, res: Response) => {
    const { memberId, iqamaNumber, name, phoneNumber, status, areaName } =
      req.body;

    // Validate required fields
    if (!memberId || !iqamaNumber || !name) {
      throw new ApiError(400, "memberId, iqamaNumber, and name are required.");
    }

    // Check for duplicates
    const existingMember = await prismaClient.membership.findFirst({
      where: {
        OR: [{ memberId }, { iqamaNumber }],
      },
    });

    if (existingMember) {
      throw new ApiError(
        400,
        "Member with the same memberId or iqamaNumber already exists."
      );
    }

    // Create new membership
    const newMember = await prismaClient.membership.create({
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
      .json(new ApiResponse(201, newMember, "Membership added successfully."));
  }
);
// Controller for editing membership

export const editMembership = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { memberId, iqamaNumber, name, phoneNumber, status, areaName } =
      req.body;

    // Convert string ID to number
    const membershipId = parseInt(id);
    if (isNaN(membershipId)) {
      throw new ApiError(400, "Invalid membership ID");
    }

    // Validate required fields
    if (!memberId || !iqamaNumber || !name) {
      throw new ApiError(400, "memberId, iqamaNumber, and name are required.");
    }

    // Check if membership exists
    const existingMembership = await prismaClient.membership.findUnique({
      where: { id: membershipId },
    });

    if (!existingMembership) {
      throw new ApiError(404, "Membership not found.");
    }

    // Check for duplicates with other members (excluding current one)
    const duplicateCheck = await prismaClient.membership.findFirst({
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
      throw new ApiError(
        400,
        "Another member with the same memberId or iqamaNumber already exists."
      );
    }

    // Update membership
    const updatedMember = await prismaClient.membership.update({
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
      .json(
        new ApiResponse(200, updatedMember, "Membership updated successfully.")
      );
  }
);
export const uploadBanner = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    // ✅ Compress image using Sharp (Resize & Convert to JPEG)
    const compressedImage = await sharp(req.file.buffer)
      .resize(376, 388) // Adjust width & height (optional)
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

      return res.json(
        new ApiResponse(200, null, "Banner updated successfully")
      );
    }

    // ✅ Create new banner
    await prismaClient.banner.create({ data: { image: compressedImage } });

    res
      .status(201)
      .json(new ApiResponse(201, null, "Banner uploaded successfully"));
  }
);

export const getBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await prismaClient.banner.findFirst();
  if (!banner) {
    throw new ApiError(404, "No banner found");
  }

  res.json({
    success: true,
    image: `data:image/jpeg;base64,${Buffer.from(banner.image).toString(
      "base64"
    )}`,
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

  res.json(
    new ApiResponse(201, { eventId: event.id }, "Event created successfully")
  );
});
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { title, eventDate, place, timing, highlights, eventType } = req.body;

  // Validate required fields
  if (!title || !eventDate || !place || !timing) {
    throw new ApiError(400, "Missing required fields");
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
    imageBuffer = await sharp(req.file.buffer)
      .resize(800)
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  // Build update data
  const updateData = {
    title,
    eventDate: new Date(eventDate),
    place,
    timing,
    highlights: highlightsData,
    eventType,
    ...(imageBuffer && { image: imageBuffer }), // Only include image if it exists
  };

  // Update event
  const updatedEvent = await prismaClient.event.update({
    where: { id: Number(eventId) },
    data: updateData,
  });

  res.json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});
export const markAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { eventId, userId } = req.body;

    const updated = await prismaClient.eventRegistration.updateMany({
      where: { eventId, userId },
      data: { isAttended: true },
    });

    if (updated.count === 0) {
      throw new ApiError(404, "User not found in this event");
    }

    res.json(new ApiResponse(200, null, "Attendance marked successfully"));
  }
);

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
    image: event.image
      ? `data:image/jpeg;base64,${Buffer.from(event.image).toString("base64")}`
      : null,
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

export const updateEventImage = asyncHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.body;

    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    const event = await prismaClient.event.findUnique({
      where: { id: Number(eventId) },
    });
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
  }
);

export const getEventById = asyncHandler(
  async (req: Request, res: Response) => {
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
      image: event.image
        ? `data:image/jpeg;base64,${Buffer.from(event.image).toString(
            "base64"
          )}`
        : null,
    };

    res.json(
      new ApiResponse(200, eventWithImage, "Event retrieved successfully")
    );
  }
);

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

export const updateEventStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    // Validate eventId
    if (!eventId) {
      throw new ApiError(400, "Invalid event ID");
    }
    // Check if the event exists
    const event = await prismaClient.event.findUnique({
      where: { id: Number(eventId) },
    });

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    // Update the isFinished state
    const updatedEvent = await prismaClient.event.update({
      where: { id: Number(eventId) },
      data: { isFinished: true },
    });

    res.json(
      new ApiResponse(200, updatedEvent, "Event status updated successfully")
    );
  }
);

// Get all users with pagination and searching
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const pageNumber = parseInt(page as string) || 1;
  const pageSize = parseInt(limit as string) || 10;
  const searchQuery = search as string;

  const users = await prismaClient.user.findMany({
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

  const totalUsers = await prismaClient.user.count({
    where: {
      OR: [
        { name: { contains: searchQuery } },
        { iqamaNumber: { contains: searchQuery } },
        { memberId: { contains: searchQuery } },
      ],
    },
  });

  // Convert profile image to base64
  const formattedUsers = users.map((user) => ({
    ...user,
    profileImage: user.profileImage
      ? Buffer.from(user.profileImage).toString("base64")
      : null,
  }));

  res.json(
    new ApiResponse(
      200,
      {
        users: formattedUsers,
        pagination: {
          totalUsers,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(totalUsers / pageSize),
        },
      },
      "Users fetched successfully"
    )
  );
});

// Get a single user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prismaClient.user.findUnique({
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
    return res.json(new ApiError(404, "User not found"));
  }

  // Convert profile image to base64
  const formattedUser = {
    ...user,
    profileImage: user.profileImage
      ? Buffer.from(user.profileImage).toString("base64")
      : null,
  };

  res.json(
    new ApiResponse(200, formattedUser, "User details fetched successfully")
  );
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  // Fetch total number of users
  const totalUsers = await prismaClient.user.count();

  // Fetch total number of memberships
  const totalMemberships = await prismaClient.membership.count();

  // Return the stats
  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalMemberships,
        userTrend: [10, 15, 30, 25, 40, 50, 60],
        membershipTrend: [5, 10, 15, 12, 20, 25, 28],
      },
      "Stats fetched successfully."
    )
  );
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  // const adminId = req.user?.id; // Assuming you have authentication middleware

  // 1. Validate input
  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required"));
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
  const userToDelete = await prismaClient.user.findUnique({
    where: { id: parseInt(userId) },
  });

  if (!userToDelete) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
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
  await prismaClient.$transaction([
    // Delete all related records first
    prismaClient.userSurveyAnswer.deleteMany({
      where: { userId: parseInt(userId) },
    }),
    prismaClient.userSurvey.deleteMany({ where: { userId: parseInt(userId) } }),
    // Add other relations as needed...

    // Then delete the user
    prismaClient.user.delete({ where: { id: parseInt(userId) } }),
  ]);

  // 7. Return success response
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});
