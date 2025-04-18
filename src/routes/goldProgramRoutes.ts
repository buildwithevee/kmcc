import express from "express";
import { addUserToGoldProgram, addWinners, createGoldProgram, createMonthlyData, endCurrentCycle, getAllGoldPrograms, getCycleDetails, getCycleLots, getCycleMonthlyData, getMonthlyDataDetails, getMonthlyWinners, getProgramCycles, getProgramDetails, removeWinner, startNewCycle, toggleLotStatus, toggleProgramStatus } from "../controllers/goldProgramController";


const router = express.Router();

// Program routes
router.post("/programs", createGoldProgram);
router.get("/programs", getAllGoldPrograms);
router.get("/programs/:programId", getProgramDetails);
router.patch("/programs/:programId/status", toggleProgramStatus);

// Cycle routes
router.post("/programs/:programId/start-cycle", startNewCycle);
router.post("/programs/:programId/end-cycle", endCurrentCycle);
router.get("/programs/:programId/cycles", getProgramCycles);
router.get("/cycles/:cycleId", getCycleDetails);

// Lot routes
router.post("/lots", addUserToGoldProgram);
router.get("/cycles/:cycleId/lots", getCycleLots);
router.patch("/lots/:lotId/status", toggleLotStatus);

// Monthly data routes
router.post("/monthly-data", createMonthlyData);
router.get("/cycles/:cycleId/monthly-data", getCycleMonthlyData);
router.get("/monthly-data/:monthlyDataId", getMonthlyDataDetails);

// Winner routes
router.post("/winners", addWinners);
router.get("/monthly-data/:monthlyDataId/winners", getMonthlyWinners);
router.delete("/winners/:winnerId", removeWinner);

export default router;
