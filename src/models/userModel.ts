import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
    // name: string;
    userName: string;
    avatar?: string;
    password: string;
    email: string;
    phone: string;
    loginType?: string;
    googleId?: string;
    facebookId?: string;
    appleId?: string;
    isBlocked?: boolean;
    isOtpVerified?: boolean;
    fcmToken?: string;
    country: string;
    dob: string;
}

const userSchema = new Schema<IUser>({
    // name: { type: String, required: true,trim:true },
    userName: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: "" },
    password: { type: String, select: false },
    email: { type: String, unique: true, trim: true },
    phone: { type: String, unique: true, trim: true },
    loginType: { type: String, enum: ["normal", "google", "facebook", "apple"], default: "normal", index: true, select: false },
    googleId: { type: String, select: false },
    facebookId: { type: String, select: false },
    appleId: { type: String, select: false },
    isBlocked: { type: Boolean, default: false },
    isOtpVerified: { type: Boolean, default: false },
    fcmToken: { type: String, select: false },
    country: { type: String, enum: ["india", "saudi", "qatar"] },
    dob: { type: String, select: false },
}, {
    timestamps: true
});


const User = mongoose.model<IUser>('User', userSchema);
export default User;
