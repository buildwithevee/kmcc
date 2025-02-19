import { Request, Response } from "express";


import { asyncHandler } from "../utils/asyncHandler";
import { ApiError, ApiResponse } from "../utils/apiHandlerHelpers";
import { prismaClient } from "../config/db";
import sharp from "sharp";


export const createNews = asyncHandler(async (req: Request, res: Response) => {
    const { type, heading, author, body } = req.body;

    if (!type || !heading || !author || !body || !req.files) {
        throw new ApiError(400, "All fields are required, including the image and authorImage.");
    }

    // Ensure both images are uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (!files.image || !files.authorImage) {
        throw new ApiError(400, "Both news image and author image are required.");
    }

    try {
        console.log("Before compressing images...");

        // Compress News Image
        const compressedImage = await sharp(files.image[0].buffer)
            .resize(800)
            .jpeg({ quality: 70 })
            .toBuffer();

        // Compress Author Profile Image
        const compressedAuthorImage = await sharp(files.authorImage[0].buffer)
            .resize(200) // Smaller size for author profile
            .jpeg({ quality: 70 })
            .toBuffer();

        console.log("Images compressed successfully.");

        console.log("Before inserting into DB...");
        const news = await prismaClient.news.create({
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

        res.status(201).json(new ApiResponse(201, news, "News created successfully."));
    } catch (error) {
        console.error("Error inserting news:", error);
        throw new ApiError(500, "Internal Server Error.");
    }
});





// ✅ Get All News
export const getAllNews = asyncHandler(async (req: Request, res: Response) => {
    try {
        let { page, limit } = req.query;

        const pageNumber = parseInt(page as string) || 1; // Default page = 1
        const pageSize = parseInt(limit as string) || 10; // Default limit = 10

        const skip = (pageNumber - 1) * pageSize;

        // ✅ Fetch news with required fields and pagination
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
        const totalNews = await prismaClient.news.count();
        const totalPages = Math.ceil(totalNews / pageSize);

        res.status(200).json(new ApiResponse(200, {
            currentPage: pageNumber,
            totalPages,
            pageSize,
            totalNews,
            news: formattedNews,
        }, "News list retrieved successfully."));

    } catch (error) {
        throw new ApiError(500, "Error retrieving news");
    }
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
        authorImage: `data:image/jpeg;base64,${Buffer.from(news.authorImage).toString("base64")}`
    };

    res.status(200).json(new ApiResponse(200, formattedNews, "News retrieved successfully."));
});

// ✅ Update News
export const updateNews = asyncHandler(async (req: Request, res: Response) => {
    const { type, heading, author, body } = req.body;
    const { id } = req.params;

    const existingNews = await prismaClient.news.findUnique({ where: { id: Number(id) } });
    if (!existingNews) {
        throw new ApiError(404, "News not found.");
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let updatedImage = existingNews.image;
    let updatedAuthorImage = existingNews.authorImage;

    if (files.image) {
        updatedImage = await sharp(files.image[0].buffer)
            .resize(800)
            .jpeg({ quality: 70 })
            .toBuffer();
    }

    if (files.authorImage) {
        updatedAuthorImage = await sharp(files.authorImage[0].buffer)
            .resize(200)
            .jpeg({ quality: 70 })
            .toBuffer();
    }

    console.log("Updating news in DB...");
    await prismaClient.news.update({
        where: { id: Number(id) },
        data: { type, heading, author, body, image: updatedImage, authorImage: updatedAuthorImage },
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
