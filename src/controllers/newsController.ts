import { Request, Response } from "express";


import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError, ApiResponse } from "@/utils/apiHandlerHelpers";
import { prismaClient } from "@/config/db";
import sharp from "sharp";


export const createNews = asyncHandler(async (req: Request, res: Response) => {
    const { type, heading, author, body } = req.body;

    if (!type || !heading || !author || !body || !req.file) {
        throw new ApiError(400, "All fields are required, including the image.");
    }

    console.log("Before compressing image...");
    const compressedImage = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 70 })
        .toBuffer();
    console.log("Image compressed successfully.");

    console.log("Before inserting into DB...");
    const news = await prismaClient.news.create({
        data: { type, heading, author, body, image: compressedImage },
    });
    console.log("News inserted successfully.");

    res.status(201).json(new ApiResponse(201, {}, "News created successfully."));

});



// ✅ Get All News
export const getAllNews = asyncHandler(async (req: Request, res: Response) => {
    let { page, limit } = req.query;

    const pageNumber = parseInt(page as string) || 1; // Default page = 1
    const pageSize = parseInt(limit as string) || 10; // Default limit = 10

    const skip = (pageNumber - 1) * pageSize;

    // ✅ Fetch news with only required fields and pagination
    const newsList = await prismaClient.news.findMany({
        skip,
        take: pageSize,
        select: {
            id: true,
            type: true,
            heading: true,
            author: true,
            createdAt: true,
            image: true, // Binary data
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
    }));

    // ✅ Get total count for pagination info
    const totalNews = await prismaClient.news.count();
    const totalPages = Math.ceil(totalNews / pageSize);

    res.status(200).json(new ApiResponse(200, {
        currentPage: pageNumber,
        totalPages,
        pageSize,
        totalNews,
        news: formattedNews,
    }, "News list retrieved successfully."));
});


// ✅ Get Single News
export const getNewsById = asyncHandler(async (req: Request, res: Response) => {
    const newsId = Number(req.params.id);
    if (isNaN(newsId)) throw new ApiError(400, "Invalid news ID.");

    const news = await prismaClient.news.findUnique({ where: { id: newsId } });
    if (!news) throw new ApiError(404, "News not found.");

    const formattedNews = {
        ...news,
        image: `data:image/jpeg;base64,${Buffer.from(news.image).toString("base64")}`,
    };

    res.status(200).json(new ApiResponse(200, formattedNews, "News retrieved successfully."));
});

// ✅ Update News
export const updateNews = asyncHandler(async (req: Request, res: Response) => {
    const newsId = Number(req.params.id);
    if (isNaN(newsId)) throw new ApiError(400, "Invalid news ID.");

    const { type, heading, author, body } = req.body;

    const existingNews = await prismaClient.news.findUnique({ where: { id: newsId } });
    if (!existingNews) throw new ApiError(404, "News not found.");

    let updatedImage = existingNews.image;

    // ✅ Compress new image if provided
    if (req.file) {
        updatedImage = await sharp(req.file.buffer)
            .resize(800) // Resize width to 800px (maintaining aspect ratio)
            .jpeg({ quality: 70 }) // Convert to JPEG with 70% quality
            .toBuffer();
    }

    // ✅ Update the news
    const updatedNews = await prismaClient.news.update({
        where: { id: newsId },
        data: {
            type: type || existingNews.type,
            heading: heading || existingNews.heading,
            author: author || existingNews.author,
            body: body || existingNews.body,
            image: updatedImage, // Update image only if provided
        },
    });

    res.status(200).json(new ApiResponse(200, {}, "News updated successfully."));
});

// ✅ Delete News
export const deleteNews = asyncHandler(async (req: Request, res: Response) => {
    const newsId = Number(req.params.id);
    if (isNaN(newsId)) throw new ApiError(400, "Invalid news ID.");

    const existingNews = await prismaClient.news.findUnique({ where: { id: newsId } });
    if (!existingNews) throw new ApiError(404, "News not found.");

    await prismaClient.news.delete({ where: { id: newsId } });

    res.status(200).json(new ApiResponse(200, null, "News deleted successfully."));
});
