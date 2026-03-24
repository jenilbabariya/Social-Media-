import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { User } from "../models/user.model.js";
import { errorResponse } from "../lib/general.js";

const authmiddleware = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
        return res.status(401).json(errorResponse("User not logged in"));
    }

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, env.jwt_secret);

            const user = await User.findById(decoded.userId).select("-password");
            if (!user) {
                return res.status(401).json(errorResponse("User not found"));
            }

            req.user = user;
            res.locals.loggedInUser = user;
            return next();

        } catch (err) {
        }
    }

    if (refreshToken) {
        try {
            const decodedRefresh = jwt.verify(refreshToken, env.jwt_secret);

            const user = await User.findById(decodedRefresh.userId).select("-password");
            if (!user) {
                return res.status(401).json(errorResponse("User not found"));
            }

            const newAccessToken = jwt.sign(
                { userId: decodedRefresh.userId },
                env.jwt_secret,
                { expiresIn: "15m" }
            );

            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,
                sameSite: "strict",
            });

            req.user = user;
            res.locals.loggedInUser = user;
            return next();

        } catch (err) {
            return res.status(401).json(errorResponse("Session expired"));
        }
    }

    return res.status(401).json(errorResponse("Authentication failed"));
};

export default authmiddleware;
