import multer from "multer";

// ⚡ Configure Multer for File Upload
const storage = multer.memoryStorage();
export const upload = multer({ storage });