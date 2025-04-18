import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiResponse } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";
// Program Controllers
export const createGoldProgram = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name) throw new ApiError(400, "Program name is required");

    const program = await prismaClient.goldInvestmentProgram.create({
      data: { name, description: description || null },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          program,
          "Gold investment program created successfully"
        )
      );
  }
);

export const getAllGoldPrograms = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const searchQuery = search as string;

    const whereClause = {
      OR: [
        { name: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ],
    };

    const [programs, totalCount] = await Promise.all([
      prismaClient.goldInvestmentProgram.findMany({
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { cycles: true } } },
      }),
      prismaClient.goldInvestmentProgram.count({ where: whereClause }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          programs,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        },
        "Gold investment programs fetched successfully"
      )
    );
  }
);

export const toggleProgramStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId } = req.params;

    const program = await prismaClient.goldInvestmentProgram.findUnique({
      where: { id: parseInt(programId) },
    });

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    const updatedProgram = await prismaClient.goldInvestmentProgram.update({
      where: { id: parseInt(programId) },
      data: { isActive: !program.isActive },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedProgram,
          "Program status updated successfully"
        )
      );
  }
);

export const getProgramDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId } = req.params;

    const program = await prismaClient.goldInvestmentProgram.findUnique({
      where: { id: parseInt(programId) },
      include: {
        cycles: {
          orderBy: { startDate: "desc" },
          take: 5,
        },
        _count: {
          select: {
            cycles: true,
          },
        },
      },
    });

    if (!program) {
      throw new ApiError(404, "Program not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, program, "Program details fetched successfully")
      );
  }
);
export const startNewCycle = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId } = req.body;
    const program = await prismaClient.goldInvestmentProgram.findUnique({
      where: { id: programId },
    });

    if (!program) throw new ApiError(404, "Program not found");
    if (!program.isActive) throw new ApiError(400, "Program is not active");

    const activeCycle = await prismaClient.goldInvestmentCycle.findFirst({
      where: { programId, isActive: true },
    });
    if (activeCycle)
      throw new ApiError(400, "Program already has an active cycle");

    const [newCycle] = await prismaClient.$transaction([
      prismaClient.goldInvestmentCycle.create({
        data: { programId, isActive: true },
      }),
      prismaClient.goldInvestmentProgram.update({
        where: { id: programId },
        data: { currentCycleId: programId },
      }),
    ]);

    await prismaClient.goldInvestmentProgram.update({
      where: { id: programId },
      data: { currentCycleId: newCycle.id },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newCycle, "New cycle started successfully"));
  }
);
export const endCurrentCycle = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId } = req.body;
    const program = await prismaClient.goldInvestmentProgram.findUnique({
      where: { id: programId },
      include: { cycles: true },
    });

    if (!program) throw new ApiError(404, "Program not found");
    const currentCycle = program.cycles.find((c) => c.isActive);
    if (!currentCycle)
      throw new ApiError(400, "No active cycle found for this program");

    const [endedCycle, newCycle] = await prismaClient.$transaction([
      prismaClient.goldInvestmentCycle.update({
        where: { id: currentCycle.id },
        data: { isActive: false, endDate: new Date() },
      }),
      prismaClient.goldInvestmentCycle.create({
        data: { programId, isActive: true },
      }),
    ]);

    await prismaClient.goldInvestmentProgram.update({
      where: { id: programId },
      data: { currentCycleId: newCycle.id },
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          endedCycle,
          newCycle,
        },
        "Cycle ended and new cycle started successfully"
      )
    );
  }
);

export const getProgramCycles = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const [cycles, totalCount] = await Promise.all([
      prismaClient.goldInvestmentCycle.findMany({
        where: { programId: parseInt(programId) },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: { startDate: "desc" },
        include: {
          _count: {
            select: {
              lots: true,
              monthlyData: true,
            },
          },
          monthlyData: {
            select: {
              _count: {
                select: {
                  winners: true,
                },
              },
            },
          },
        },
      }),
      prismaClient.goldInvestmentCycle.count({
        where: { programId: parseInt(programId) },
      }),
    ]);

    // Calculate total winners per cycle
    const cyclesWithStats = cycles.map((cycle) => {
      const totalWinners = cycle.monthlyData.reduce(
        (sum, md) => sum + md._count.winners,
        0
      );
      return {
        ...cycle,
        totalWinners,
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cycles: cyclesWithStats,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit as string)),
          },
        },
        "Program cycles fetched successfully"
      )
    );
  }
);
export const getCycleDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { cycleId } = req.params;

    const cycle = await prismaClient.goldInvestmentCycle.findUnique({
      where: { id: parseInt(cycleId) },
      include: {
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            lots: true,
            monthlyData: true,
          },
        },
        monthlyData: {
          include: {
            _count: {
              select: {
                winners: true,
              },
            },
          },
        },
      },
    });

    if (!cycle) {
      throw new ApiError(404, "Cycle not found");
    }

    // Calculate total winners across all monthly data
    const totalWinners = cycle.monthlyData.reduce(
      (sum, monthlyData) => sum + monthlyData._count.winners,
      0
    );

    const responseData = {
      ...cycle,
      totalWinners,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(200, responseData, "Cycle details fetched successfully")
      );
  }
);
export const addUserToGoldProgram = asyncHandler(
  async (req: Request, res: Response) => {
    const { programId, userId } = req.body;
    if (!programId || !userId)
      throw new ApiError(400, "Program ID and User ID are required");

    const program = await prismaClient.goldInvestmentProgram.findUnique({
      where: { id: programId },
      include: { cycles: { where: { isActive: true }, take: 1 } },
    });

    if (!program) throw new ApiError(404, "Program not found");
    if (!program.isActive) throw new ApiError(400, "Program is not active");
    if (!program.cycles.length) throw new ApiError(400, "No active cycle");

    const user = await prismaClient.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");

    const existingLot = await prismaClient.goldInvestmentLot.findFirst({
      where: { cycleId: program.cycles[0].id, userId, isActive: true },
    });
    if (existingLot)
      throw new ApiError(400, "User already has an active lot in this cycle");

    const lot = await prismaClient.goldInvestmentLot.create({
      data: { cycleId: program.cycles[0].id, userId },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, lot, "User added to program successfully"));
  }
);

export const getCycleLots = asyncHandler(
  async (req: Request, res: Response) => {
    const { cycleId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const searchQuery = search as string;

    const cycleExists = await prismaClient.goldInvestmentCycle.findUnique({
      where: { id: parseInt(cycleId) },
    });

    if (!cycleExists) throw new ApiError(404, "Cycle not found");

    const whereClause = {
      cycleId: parseInt(cycleId),
      user: {
        OR: [
          { name: { contains: searchQuery } },
          { memberId: { contains: searchQuery } },
        ],
      },
    };

    const [lots, totalCount] = await Promise.all([
      prismaClient.goldInvestmentLot.findMany({
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
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
        orderBy: { createdAt: "desc" },
      }),
      prismaClient.goldInvestmentLot.count({ where: whereClause }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          lots,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        },
        "Cycle lots fetched successfully"
      )
    );
  }
);

export const toggleLotStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { lotId } = req.params;

    const lot = await prismaClient.goldInvestmentLot.findUnique({
      where: { id: parseInt(lotId) },
    });

    if (!lot) throw new ApiError(404, "Lot not found");

    const updatedLot = await prismaClient.goldInvestmentLot.update({
      where: { id: parseInt(lotId) },
      data: { isActive: !lot.isActive },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedLot, "Lot status updated successfully")
      );
  }
);
export const createMonthlyData = asyncHandler(
  async (req: Request, res: Response) => {
    const { cycleId, month, year } = req.body;
    if (!cycleId || !month || !year)
      throw new ApiError(400, "Cycle ID, month, and year are required");

    const cycle = await prismaClient.goldInvestmentCycle.findUnique({
      where: { id: cycleId },
    });
    if (!cycle) throw new ApiError(404, "Cycle not found");
    if (!cycle.isActive) throw new ApiError(400, "Cycle is not active");

    const existingData = await prismaClient.goldInvestmentMonthlyData.findFirst(
      {
        where: { cycleId, month, year },
      }
    );
    if (existingData)
      throw new ApiError(400, "Monthly data already exists for this period");

    const [monthlyData] = await prismaClient.$transaction([
      prismaClient.goldInvestmentMonthlyData.create({
        data: { cycleId, month, year },
      }),
      prismaClient.$executeRaw`
        INSERT INTO gold_payments (monthlyDataId, lotId, isPaid, createdAt)
        SELECT ${cycleId}, id, false, NOW()
        FROM gold_lots WHERE cycleId = ${cycleId} AND isActive = true
      `,
    ]);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          monthlyData,
          "Monthly data created with payment records"
        )
      );
  }
);

export const recordMonthlyPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const { monthlyDataId, payments } = req.body;
    const monthlyData = await prismaClient.goldInvestmentMonthlyData.findUnique(
      {
        where: { id: monthlyDataId },
        include: { cycle: true },
      }
    );

    if (!monthlyData) throw new ApiError(404, "Monthly data not found");
    if (!monthlyData.cycle.isActive)
      throw new ApiError(400, "Cycle is not active");

    const results = await prismaClient.$transaction(
      payments.map((payment: { lotId: number; isPaid: boolean }) =>
        prismaClient.goldInvestmentPayment.upsert({
          where: {
            monthlyDataId_lotId: { monthlyDataId, lotId: payment.lotId },
          },
          update: {
            isPaid: payment.isPaid,
            paymentDate: payment.isPaid ? new Date() : null,
          },
          create: {
            monthlyDataId,
            lotId: payment.lotId,
            isPaid: payment.isPaid,
            paymentDate: payment.isPaid ? new Date() : null,
          },
        })
      )
    );

    return res
      .status(200)
      .json(new ApiResponse(200, results, "Payments recorded successfully"));
  }
);

export const getCycleMonthlyData = asyncHandler(
  async (req: Request, res: Response) => {
    const { cycleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;

    const cycleExists = await prismaClient.goldInvestmentCycle.findUnique({
      where: { id: parseInt(cycleId) },
    });

    if (!cycleExists) throw new ApiError(404, "Cycle not found");

    const whereClause = {
      cycleId: parseInt(cycleId),
    };

    const [monthlyData, totalCount] = await Promise.all([
      prismaClient.goldInvestmentMonthlyData.findMany({
        where: whereClause,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { winners: true },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      prismaClient.goldInvestmentMonthlyData.count({ where: whereClause }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          monthlyData,
          pagination: {
            page: pageNumber,
            limit: pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        },
        "Monthly data fetched successfully"
      )
    );
  }
);

export const getMonthlyDataDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { monthlyDataId } = req.params;

    const monthlyData = await prismaClient.goldInvestmentMonthlyData.findUnique(
      {
        where: { id: parseInt(monthlyDataId) },
        include: {
          cycle: {
            include: {
              program: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              winners: true,
            },
          },
        },
      }
    );

    if (!monthlyData) throw new ApiError(404, "Monthly data not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          monthlyData,
          "Monthly data details fetched successfully"
        )
      );
  }
);
export const addWinners = asyncHandler(async (req: Request, res: Response) => {
  const { monthlyDataId, lotIds } = req.body;
  if (!monthlyDataId || !lotIds || !Array.isArray(lotIds)) {
    throw new ApiError(
      400,
      "Monthly data ID and array of lot IDs are required"
    );
  }

  const monthlyData = await prismaClient.goldInvestmentMonthlyData.findUnique({
    where: { id: monthlyDataId },
    include: { cycle: true },
  });
  if (!monthlyData) throw new ApiError(404, "Monthly data not found");
  if (!monthlyData.cycle.isActive)
    throw new ApiError(400, "Cycle is not active");

  // Verify all lots belong to this cycle and are active
  const lots = await prismaClient.goldInvestmentLot.findMany({
    where: { id: { in: lotIds }, cycleId: monthlyData.cycleId, isActive: true },
  });
  if (lots.length !== lotIds.length)
    throw new ApiError(400, "One or more lots are invalid or not active");

  // Verify all lots have paid for this month
  const unpaidLots = await prismaClient.goldInvestmentPayment.findMany({
    where: {
      monthlyDataId,
      lotId: { in: lotIds },
      isPaid: false,
    },
  });
  if (unpaidLots.length > 0)
    throw new ApiError(
      400,
      "One or more selected lots haven't paid for this month"
    );

  const winners = await prismaClient.$transaction(
    lotIds.map((lotId) =>
      prismaClient.goldInvestmentWinner.create({
        data: { monthlyDataId, lotId },
        include: {
          lot: {
            include: {
              user: {
                select: { id: true, name: true, memberId: true },
              },
            },
          },
        },
      })
    )
  );

  return res
    .status(201)
    .json(new ApiResponse(201, winners, "Winners added successfully"));
});

export const getMonthlyWinners = asyncHandler(
  async (req: Request, res: Response) => {
    const { monthlyDataId } = req.params;

    const monthlyData = await prismaClient.goldInvestmentMonthlyData.findUnique(
      {
        where: { id: parseInt(monthlyDataId) },
        include: {
          winners: {
            include: {
              lot: {
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
              },
            },
          },
        },
      }
    );

    if (!monthlyData) throw new ApiError(404, "Monthly data not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          monthlyData.winners,
          "Winners fetched successfully"
        )
      );
  }
);

export const removeWinner = asyncHandler(
  async (req: Request, res: Response) => {
    const { winnerId } = req.params;

    const winner = await prismaClient.goldInvestmentWinner.findUnique({
      where: { id: parseInt(winnerId) },
    });

    if (!winner) throw new ApiError(404, "Winner not found");

    await prismaClient.goldInvestmentWinner.delete({
      where: { id: parseInt(winnerId) },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Winner removed successfully"));
  }
);
