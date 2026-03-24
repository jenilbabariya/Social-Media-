import mongoose from "mongoose";
const userTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    token: {
        type: String,
        required: true,
    },

    tokenType: {
       type: String,
       enum: ["access", "refresh"],
       default: "access",
    },

    ip: {
        type: String,
    },

    userAgent: {
        type: String,
    },

    expiresAt: {
        type: Date,
        required: true,
    },
},

);

const UserToken = mongoose.model("UserToken", userTokenSchema);
export default UserToken;