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
exports.deleteNews = exports.updateNews = exports.getNewsById = exports.getAllNews = exports.createNews = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiHandlerHelpers_1 = require("../utils/apiHandlerHelpers");
const db_1 = require("../config/db");
const sharp_1 = __importDefault(require("sharp"));
exports.createNews = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, heading, author, body } = req.body;
    if (!type || !heading || !author || !body || !req.files) {
        throw new apiHandlerHelpers_1.ApiError(400, "All fields are required, including the image and authorImage.");
    }
    // Ensure both images are uploaded
    const files = req.files;
    if (!files.image || !files.authorImage) {
        throw new apiHandlerHelpers_1.ApiError(400, "Both news image and author image are required.");
    }
    try {
        console.log("Before compressing images...");
        // Compress News Image
        const compressedImage = yield (0, sharp_1.default)(files.image[0].buffer)
            .resize(800)
            .jpeg({ quality: 70 })
            .toBuffer();
        // Compress Author Profile Image
        const compressedAuthorImage = yield (0, sharp_1.default)(files.authorImage[0].buffer)
            .resize(200) // Smaller size for author profile
            .jpeg({ quality: 70 })
            .toBuffer();
        console.log("Images compressed successfully.");
        console.log("Before inserting into DB...");
        const news = yield db_1.prismaClient.news.create({
            data: {
                type,
                heading,
                author,
                body,
                image: compressedImage,
                authorImage: compressedAuthorImage,
            },
        });
        console.log("News inserted successfully.");
        res.status(201).json(new apiHandlerHelpers_1.ApiResponse(201, news, "News created successfully."));
    }
    catch (error) {
        console.error("Error inserting news:", error);
        throw new apiHandlerHelpers_1.ApiError(500, "Internal Server Error.");
    }
}));
// ✅ Get All News
exports.getAllNews = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1; // Default page = 1
        const pageSize = parseInt(limit) || 10; // Default limit = 10
        const skip = (pageNumber - 1) * pageSize;
        // ✅ Fetch news with required fields and pagination
        const newsList = yield db_1.prismaClient.news.findMany({
            skip,
            take: pageSize,
            select: {
                id: true,
                type: true,
                heading: true,
                author: true,
                createdAt: true,
                image: true, // Binary data
                authorImage: true,
            },
            orderBy: { createdAt: "desc" }, // Sort by latest news
        });
        // ✅ Convert binary images to Base64
        const formattedNews = newsList.map(news => ({
            id: news.id,
            type: news.type,
            heading: news.heading,
            author: news.author,
            createdAt: news.createdAt,
            image: news.image ? `data:image/jpeg;base64,${Buffer.from(news.image).toString("base64")}` : null,
            authorImage: news.authorImage ? `data:image/jpeg;base64,${Buffer.from(news.authorImage).toString("base64")}` : null,
        }));
        // ✅ Get total count for pagination info
        const totalNews = yield db_1.prismaClient.news.count();
        const totalPages = Math.ceil(totalNews / pageSize);
        res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {
            currentPage: pageNumber,
            totalPages,
            pageSize,
            totalNews,
            news: formattedNews,
        }, "News list retrieved successfully."));
    }
    catch (error) {
        throw new apiHandlerHelpers_1.ApiError(500, "Error retrieving news");
    }
}));
// ✅ Get Single News
exports.getNewsById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newsId = Number(req.params.id);
    if (isNaN(newsId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid news ID.");
    const news = yield db_1.prismaClient.news.findUnique({ where: { id: newsId } });
    if (!news)
        throw new apiHandlerHelpers_1.ApiError(404, "News not found.");
    const formattedNews = Object.assign(Object.assign({}, news), { image: `data:image/jpeg;base64,${Buffer.from(news.image).toString("base64")}` });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, formattedNews, "News retrieved successfully."));
}));
// ✅ Update News
exports.updateNews = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { type, heading, author, body } = req.body;
    const { id } = req.params;
    const existingNews = yield db_1.prismaClient.news.findUnique({ where: { id: Number(id) } });
    if (!existingNews) {
        throw new apiHandlerHelpers_1.ApiError(404, "News not found.");
    }
    const files = req.files;
    let updatedImage = existingNews.image;
    let updatedAuthorImage = existingNews.authorImage;
    if (files.image) {
        updatedImage = yield (0, sharp_1.default)(files.image[0].buffer)
            .resize(800)
            .jpeg({ quality: 70 })
            .toBuffer();
    }
    if (files.authorImage) {
        updatedAuthorImage = yield (0, sharp_1.default)(files.authorImage[0].buffer)
            .resize(200)
            .jpeg({ quality: 70 })
            .toBuffer();
    }
    console.log("Updating news in DB...");
    yield db_1.prismaClient.news.update({
        where: { id: Number(id) },
        data: { type, heading, author, body, image: updatedImage, authorImage: updatedAuthorImage },
    });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, {}, "News updated successfully."));
}));
// ✅ Delete News
exports.deleteNews = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newsId = Number(req.params.id);
    if (isNaN(newsId))
        throw new apiHandlerHelpers_1.ApiError(400, "Invalid news ID.");
    const existingNews = yield db_1.prismaClient.news.findUnique({ where: { id: newsId } });
    if (!existingNews)
        throw new apiHandlerHelpers_1.ApiError(404, "News not found.");
    yield db_1.prismaClient.news.delete({ where: { id: newsId } });
    res.status(200).json(new apiHandlerHelpers_1.ApiResponse(200, null, "News deleted successfully."));
}));
