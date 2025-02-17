import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "@/utils/asyncHandler";
import { prismaClient } from "@/config/db";
import { ApiError, ApiResponse } from "@/utils/apiHandlerHelpers";

// ✅ Signup Controller
export const signup = asyncHandler(async (req: Request, res: Response) => {
    let { memberId, iqamaNumber, phoneNumber, password } = req.body;

    // Normalize memberId (remove leading zeros)
    memberId = parseInt(memberId, 10).toString();

    // ✅ Check if the memberId and iqamaNumber exist in the Membership table
    const existingMember = await prismaClient.membership.findFirst({
        where: {
            AND: [
                { memberId },
                { iqamaNumber }
            ]
        }
    });

    if (!existingMember) {
        throw new ApiError(400, "Invalid memberId or iqamaNumber");
    }

    // ✅ Extract the name from Membership table
    const { name } = existingMember;

    // ✅ Check if the user is already registered
    const existingUser = await prismaClient.user.findFirst({
        where: {
            OR: [{ memberId }, { iqamaNumber }]
        }
    });

    if (existingUser) {
        throw new ApiError(400, "User already registered");
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create the user
    const newUser = await prismaClient.user.create({
        data: {
            memberId,
            iqamaNumber,
            phoneNumber,
            password: hashedPassword,
            name // Taken from Membership table
        }
    });

    res.status(201).json(new ApiResponse(201, newUser, "User registered successfully"));
});

// ✅ Login Controller
export const login = asyncHandler(async (req: Request, res: Response) => {
    let { identifier, password } = req.body;

    if (!identifier || !password) {
        throw new ApiError(400, "Identifier and password are required");
    }

    console.log("🔍 Received identifier:", identifier);

    // ✅ Check if identifier is numeric and handle leading zeros properly
    let normalizedIdentifier = identifier;
    if (!isNaN(Number(identifier))) {
        // Ensure that we compare it as a string, without removing leading zeros
        normalizedIdentifier = identifier.padStart(6, "0"); // Assuming 6-digit IDs
    }

    console.log("🔍 Normalized identifier:", normalizedIdentifier);

    // ✅ Find the user (compare as a string)
    const user = await prismaClient.user.findFirst({
        where: {
            OR: [{ memberId: normalizedIdentifier }, { iqamaNumber: identifier }]
        }
    });

    console.log("🔍 Found user:", user);

    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // ✅ Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ userId: user.id }, "aju", {
        expiresIn: "7d"
    });

    res.json(new ApiResponse(200, { token, user }, "Login successful"));
});
