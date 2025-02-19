"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = require("../utils/asyncHandler");
const db_1 = require("../config/db");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
// ✅ Signup Controller
exports.signup = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { memberId, iqamaNumber, phoneNumber, password } = req.body;
    // Normalize memberId (remove leading zeros)
    memberId = parseInt(memberId, 10).toString();
    // ✅ Check if the memberId and iqamaNumber exist in the Membership table
    const existingMember = yield db_1.prismaClient.membership.findFirst({
        where: {
            AND: [
                { memberId },
                { iqamaNumber }
            ]
        }
    });
    if (!existingMember) {
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid memberId or iqamaNumber");
    }
    // ✅ Extract the name from Membership table
    const { name } = existingMember;
    // ✅ Check if the user is already registered
    const existingUser = yield db_1.prismaClient.user.findFirst({
        where: {
            OR: [{ memberId }, { iqamaNumber }]
        }
    });
    if (existingUser) {
        throw new apiHandlerHelpers_1.ApiError(400, "User already registered");
    }
    // ✅ Hash the password
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    // ✅ Create the user
    const newUser = yield db_1.prismaClient.user.create({
        data: {
            memberId,
            iqamaNumber,
            phoneNumber,
            password: hashedPassword,
            name // Taken from Membership table
        }
    });
    res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, newUser, "User registered successfully"));
}));
// ✅ Login Controller
exports.login = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { identifier, password } = req.body;
    if (!identifier || !password) {
        throw new apiHandlerHelpers_1.ApiError(400, "Identifier and password are required");
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
    const user = yield db_1.prismaClient.user.findFirst({
        where: {
            OR: [{ memberId: normalizedIdentifier }, { iqamaNumber: identifier }]
        }
    });
    console.log("🔍 Found user:", user);
    if (!user) {
        throw new apiHandlerHelpers_1.ApiError(401, "Invalid credentials");
    }
    // ✅ Compare password
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new apiHandlerHelpers_1.ApiError(401, "Invalid credentials");
    }
    // ✅ Generate JWT Token
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, "aju", {
        expiresIn: "7d"
    });
    res.json(new apiHandlerHelpers_1.ApiResponse(200, { token, user }, "Login successful"));
}));
