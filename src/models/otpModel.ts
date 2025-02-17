import mongoose, { Document, Schema, Types } from "mongoose";

interface IOTPModel extends Document {
    email: string;
    userId: Types.ObjectId;
    otp: number;
    otpType: 'forgot' | 'registeration' | 'other';
}


const otpSchema = new Schema<IOTPModel>({
    email: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    otp: {
        type: Number,
        required: true,
    },
    otpType: {
        type: String,
        enum: ["forgot", "registeration", "other"],
        default: "registeration"
    }
}, { timestamps: true });



const OTP = mongoose.model<IOTPModel>('OTP', otpSchema);
export default OTP;
