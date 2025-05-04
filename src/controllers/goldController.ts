import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiResponse } from "../utils/apiHandlerHelpers";
import { prismaClient as prisma } from "../config/db";
import * as XLSX from "xlsx";
// ===================== PROGRAM LIFECYCLE =====================
export const startGoldProgram = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;

    const activeProgram = await prisma.goldProgram.findFirst({
      where: { isActive: true },
    });
    if (activeProgram)
      throw new ApiError(400, "Another program is already active");

    const program = await prisma.goldProgram.create({
      data: { name, description, isActive: true },
    });

    res
      .status(201)
      .json(new ApiResponse(201, program, "Program started successfully"));
  }
);

export const endGoldProgram = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId } = req.body;

    const program = await prisma.goldProgram.update({
      where: { id: programId, isActive: true },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    if (!program) throw new ApiError(404, "No active program found");

    res
      .status(200)
      .json(new ApiResponse(200, program, "Program ended successfully"));
  }
);

// ===================== PROGRAM QUERIES =====================
export const getActiveProgram = asyncHandler(
  async (req: Request, res: Response) => {
    const program = await prisma.goldProgram.findFirst({
      where: { isActive: true },
      include: {
        lots: { include: { user: true } },
        winners: { include: { lot: { include: { user: true } } } },
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, program, "Active program retrieved"));
  }
);

export const getAllPrograms = asyncHandler(
  async (req: Request, res: Response) => {
    const programs = await prisma.goldProgram.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { lots: true, winners: true },
        },
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, programs, "All programs retrieved"));
  }
);

export const getProgramDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const programId = parseInt(req.params.programId);
    if (isNaN(programId)) throw new ApiError(400, "Invalid program ID");

    const program = await prisma.goldProgram.findUnique({
      where: { id: programId },
      include: {
        lots: {
          include: {
            user: true,
            payments: { orderBy: [{ year: "asc" }, { month: "asc" }] }, // Updated
            winners: { orderBy: [{ year: "asc" }, { month: "asc" }] }, // Updated
          },
        },
        winners: {
          include: {
            lot: { include: { user: true } },
          },
          orderBy: [{ year: "desc" }, { month: "asc" }], // New sorting
        },
      },
    });

    if (!program) throw new ApiError(404, "Program not found");
    res
      .status(200)
      .json(new ApiResponse(200, program, "Program details retrieved"));
  }
);

// ===================== LOT MANAGEMENT =====================
export const assignGoldLot = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId, userId } = req.body;

    // Convert programId to number
    const programIdNumber = Number(programId);
    if (isNaN(programIdNumber)) {
      throw new ApiError(400, "Invalid program ID");
    }

    const [program, user] = await Promise.all([
      prisma.goldProgram.findFirst({
        where: {
          id: programIdNumber, // Use the converted number
          isActive: true,
        },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!program) throw new ApiError(400, "No active program found");
    if (!user) throw new ApiError(404, "User not found");

    const lot = await prisma.goldLot.create({
      data: {
        programId: programIdNumber, // Use number here too
        userId,
      },
      include: { user: true },
    });

    res
      .status(201)
      .json(new ApiResponse(201, lot, "Lot assigned successfully"));
  }
);

export const getLotDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const lotId = parseInt(req.params.lotId);
    if (isNaN(lotId)) throw new ApiError(400, "Invalid lot ID");

    const lot = await prisma.goldLot.findUnique({
      where: { id: lotId },
      include: {
        user: true,
        program: true,
        payments: { orderBy: { month: "asc" } },
        winners: true,
      },
    });

    if (!lot) throw new ApiError(404, "Lot not found");
    res.status(200).json(new ApiResponse(200, lot, "Lot details retrieved"));
  }
);
export const getLotsByProgram = asyncHandler(
  async (req: Request, res: Response) => {
    const programId = parseInt(req.params.programId);
    if (isNaN(programId)) throw new ApiError(400, "Invalid program ID");

    const lots = await prisma.goldLot.findMany({
      where: { programId },
      include: {
        user: true,
        payments: true,
        winners: true,
      },
    });

    res
      .status(200)
      .json(new ApiResponse(200, lots, "Lots retrieved successfully"));
  }
);
// ===================== PAYMENT MANAGEMENT =====================
export const recordPayment = asyncHandler(
  async (req: Request, res: Response) => {
    let { lotId, year, month } = req.body;
    if (!lotId || !month || !year)
      throw new ApiError(400, "Lot ID, year and month are required");

    lotId = parseInt(lotId);
    year = parseInt(year);
    month = parseInt(month);

    const payment = await prisma.goldPayment.upsert({
      where: {
        lotId_year_month: { lotId, year, month },
      },
      update: {
        isPaid: true,
        paidAt: new Date(),
      },
      create: {
        lotId,
        year,
        month,
        isPaid: true,
        paidAt: new Date(),
      },
      include: { lot: true },
    });

    res
      .status(200)
      .json(new ApiResponse(200, payment, "Payment recorded successfully"));
  }
);

// ===================== WINNERS MANAGEMENT =====================
export const addWinners = asyncHandler(async (req: Request, res: Response) => {
  let { programId, winners } = req.body;

  if (!programId || !winners || winners.length === 0) {
    throw new ApiError(400, "Program ID and winners are required");
  }

  programId = parseInt(programId);
  if (isNaN(programId)) {
    throw new ApiError(400, "Invalid program ID");
  }

  // Validate all winners have required fields
  for (const winner of winners) {
    if (!winner.lotId || !winner.month || !winner.year) {
      throw new ApiError(400, "Each winner must have lotId, month, and year");
    }
  }

  const lotIds = winners.map((w: any) => parseInt(w.lotId));
  const months = winners.map((w: any) => parseInt(w.month));
  const years = winners.map((w: any) => parseInt(w.year));

  // Validate lots belong to this program
  const validLots = await prisma.goldLot.findMany({
    where: {
      id: { in: lotIds },
      programId,
    },
    select: { id: true },
  });

  if (validLots.length !== winners.length) {
    throw new ApiError(400, "Some lots don't belong to this program");
  }

  // Check for existing winners for the same month/year combinations
  const existingWinners = await prisma.goldWinner.findMany({
    where: {
      programId,
      OR: winners.map((w: any) => ({
        AND: [{ month: parseInt(w.month) }, { year: parseInt(w.year) }],
      })),
    },
  });

  if (existingWinners.length > 0) {
    const conflicts = existingWinners
      .map((w) => `Month ${w.month}, Year ${w.year}`)
      .join(", ");
    throw new ApiError(400, `Winners already exist for: ${conflicts}`);
  }

  // Check if any lots have already won (in any year)
  const alreadyWinningLots = await prisma.goldWinner.findMany({
    where: {
      programId,
      lotId: { in: lotIds },
    },
    distinct: ["lotId"],
  });

  if (alreadyWinningLots.length > 0) {
    const wonIds = alreadyWinningLots.map((w) => w.lotId).join(", ");
    throw new ApiError(400, `Lot(s) already won: ${wonIds}`);
  }

  // Create all winners in a transaction
  const createdWinners = await prisma.$transaction(
    winners.map((winner: any) =>
      prisma.goldWinner.create({
        data: {
          programId,
          lotId: parseInt(winner.lotId),
          month: parseInt(winner.month),
          year: parseInt(winner.year),
          prizeAmount: winner.prizeAmount
            ? parseFloat(winner.prizeAmount)
            : undefined,
        },
        include: {
          lot: {
            include: {
              user: true,
            },
          },
        },
      })
    )
  );

  res
    .status(201)
    .json(new ApiResponse(201, createdWinners, "Winners added successfully!"));
});

export const getProgramWinners = asyncHandler(
  async (req: Request, res: Response) => {
    const programId = parseInt(req.params.programId);
    if (isNaN(programId)) throw new ApiError(400, "Invalid program ID");

    const winners = await prisma.goldWinner.findMany({
      where: { programId },
      include: {
        lot: { include: { user: true } },
      },
      orderBy: [
        { year: "desc" }, // New: Sort by year first
        { month: "asc" }, // Then by month
      ],
    });

    res
      .status(200)
      .json(new ApiResponse(200, winners, "Program winners retrieved"));
  }
);
export const exportPaymentsToExcel = asyncHandler(
  async (req: Request, res: Response) => {
    const programId = parseInt(req.params.programId);
    if (isNaN(programId)) throw new ApiError(400, "Invalid program ID");

    // Get program name for filename
    const program = await prisma.goldProgram.findUnique({
      where: { id: programId },
      select: { name: true },
    });

    // Get all lots with payments and user info
    const lots = await prisma.goldLot.findMany({
      where: { programId },
      include: {
        user: true,
        payments: {
          where: { isPaid: true },
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    if (!lots.length) {
      throw new ApiError(404, "No lots found for this program");
    }

    // Prepare Excel data
    const excelData = lots.map((lot) => ({
      "Member ID": lot.user.memberId,
      Name: lot.user.name,
      "Total Payments": lot.payments.length,
      "Payment Dates": lot.payments
        .map((p) => `${p.year}-${String(p.month).padStart(2, "0")}`)
        .join(", "),
      "Last Payment": lot.payments.length
        ? `${lot.payments[lot.payments.length - 1].year}-${String(
            lot.payments[lot.payments.length - 1].month
          ).padStart(2, "0")}`
        : "None",
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

    // Generate Excel file buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Set response headers
    const filename = `gold_payments_${program?.name || programId}.xlsx`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(filename)}`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the Excel file
    res.send(Buffer.from(buffer));
  }
);
