import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import { prismaClient } from "./config/db";
import { ApiError } from "./utils/apiHandlerHelpers";
import { errorHandler } from "./utils/errorHandler";
import authRouter from "./routes/authRoutes";
import adminRouter from "./routes/adminRoutes";
import userRouter from "./routes/userRoutes";
import jobRouter from "./routes/jobRoutes";
import newsRouter from "./routes/newsRoutes";
import serviceRouter from "./routes/serviceRoutes";

dotenv.config();

const app = express();

app.use(cors());

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: {
        status: 429,
        message: 'Too many requests. Please try again after an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev')); // Logging
app.use(helmet()); // Security
app.use(compression({ threshold: 1024 }));

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, Secure and Logged World!');
});

app.use("/api/auth/", authRouter);
app.use("/api/admin/", adminRouter);
app.use("/api/user/", userRouter);
app.use("/api/jobs/", jobRouter);
app.use("/api/news/", newsRouter);
app.use("/api/services/", serviceRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
    throw new ApiError(404, "Route not found");
});

// Error-handling middleware
app.use(errorHandler as ErrorRequestHandler);

// Function to start the server
const startServer = async () => {
    try {
        await prismaClient.$connect();
        console.log("✅ Database connected successfully!");

        app.listen(3000, () => {
            console.log('🚀 Server is running on port 3000');
        });

    } catch (error) {
        console.error("❌ Failed to connect to the database:", error);
        process.exit(1); // Exit process on DB connection failure
    }
};

// Gracefully handle Prisma shutdown on app termination
process.on("SIGINT", async () => {
    await prismaClient.$disconnect();
    console.log("🛑 Prisma disconnected. Exiting...");
    process.exit(0);
});

startServer();
