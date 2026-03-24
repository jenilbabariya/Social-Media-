import { validate } from "../utills/auth.validator.js";
import { rules } from "../validators/rules.js";
import { successResponse, errorResponse, authError } from "../lib/general.js";
import { User, Profile } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import  UserToken from "../models/usertoken.model.js";


export const register = async (req, res) => {

    try {
        const validationError = validate(req.body, rules.auth.register);

        if (validationError) {
            return res.status(422).json(validationError);
        }
        const { username, email, password, fullname } = req.body;
        const exists = await User.findOne({ email }).withDeleted();
        if (exists) {
            return res.status(409).json(errorResponse("Email already registered"));
        }
        if (exists && exists.isDeleted) {
            return res.status(409).json(errorResponse("Email already registered but account is deleted. "));
        }
        const user = await User.create({
            username,
            email,
            password,
            fullname,
            accountMeta: {
                isVerified: false,
                isPrivate: false
            }
        });
        await Profile.create({
            userId: user._id
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.emailOTP = otp;
        user.otpExpire = Date.now() + 3 * 60 * 1000;
        await user.save();

        const testAccount = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        const info = await transporter.sendMail({
            from: '"Social Media App" <no-reply@test.com>',
            to: user.email,
            subject: "Email Verification OTP",
            html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 3 minutes.</p>
      `,
        });

        console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
        return res.status(200).json(successResponse("registration successfull....", user._id));

    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json(errorResponse("Server error"));
    }
};

export const login = async (req, res) => {
    try {
        const validationError = validate(req.body, rules.auth.login)
        if (validationError) {
            return res.status(422).json(validationError);
        }

        const { login, password } = req.body;

        const user = await User.findOne({
            $or: [
                { email: login.toLowerCase() },
                { username: login }
            ]
        }).withDeleted();

        if (!user) {
            return res.status(401).json(
                authError("Invalid credentials")
            );
        }
        if (!user.verified) {
            return res.status(400).json(authError("Please verify your email first."));
        }
        if (user.isDeleted) {
            return res.status(403).json(authError("Account has been deleted"));
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json(
                authError("Invalid credentials")
            );
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.jwt_secret, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.jwt_secret, { expiresIn: "7d" });

        user.refreshToken = refreshToken;

        await user.save();
        await UserToken.create({
            user: user._id,
            token: accessToken,
            tokenType: "access",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.cookie_secure,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.cookie_secure,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json(
            successResponse("Login successful", {
                accessToken,
                refreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            })
        );
    } catch (err) {
        console.error(err);
        return res.status(500).json(
            errorResponse("Server error")
        );
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json(errorResponse("user doesn't exist"));
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const resetURL = `http://localhost:5000/reset-password/${resetToken}`;
        const testAccount = await nodemailer.createTestAccount();

        const transporter = await nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        const info = await transporter.sendMail({
            from: '"Social Media App" <no-reply@test.com>',
            to: user.email,
            subject: "reset password",
            html: `       <h2>Password Reset</h2>
                     <p>Click the link below:</p>
                     <a href="${resetURL}">${resetURL}</a>
                    <p>This link expires in 10 minutes.</p>`,
        });
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

        return res.status(200).json(successResponse("Reset email sent. Check your Mail!!"));
    } catch (err) {
        console.log(err);
        return res.status(400).json(errorResponse("Something went wrong"));
    }
};

export const resetPassword = async (req, res) => {
    try {

        const validationError = validate(req.body, rules.auth.resetPassword);

        if (validationError) {
            return res.status(409).json(validationError);
        }
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");


        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(401).json(errorResponse("Token invalid or expired"));
        }
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();
        return res.status(200).json(successResponse("Password reset successful"));
    } catch (error) {
        console.log(error);
        return res.status(400).json(errorResponse("Something went wrong"));
    }
};

export const verifyOTP = async (req, res) => {
    const { otp } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) return res.redirect("/register");

    if (user.otpExpire < Date.now()) {
        return res.render("verify-otp.ejs", {

            header: {
                title: "Verify Email | SocialMedia"
            },

            body: {
                userId: user._id,
                error: "otp expired please resend"
            },

            footer: {
                js: []
            }
        });
    }

    if (user.emailOTP !== otp) {
        return res.render("verify-otp.ejs", {

            header: {
                title: "Verify Email | SocialMedia"
            },

            body: {
                userId: user._id,
                error: "invalid otp"
            },

            footer: {
                js: []
            }
        });
    }

    user.verified = true;
    user.emailOTP = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.redirect("/login-page");
};

export const resendOTP = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) return res.redirect("/register");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOTP = otp;
    user.otpExpire = Date.now() + 3 * 60 * 1000;
    await user.save();


    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    const info = await transporter.sendMail({
        from: '"Social Media App" <no-reply@test.com>',
        to: user.email,
        subject: "Email Verification OTP",
        html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 3 minutes.</p>
      `,
    });
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    res.redirect(`/verify-email/${user._id}`);
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            await User.findOneAndUpdate(
                { refreshToken },
                { $unset: { refreshToken: 1 } }
            );
        }

        const accessToken = req.cookies?.accessToken;
        if (accessToken) {
            await UserToken.deleteMany({ token: accessToken });
        }
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.cookie_secure,
            sameSite: "strict",
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.cookie_secure,
            sameSite: "strict",
        });

        return res.status(200).json(successResponse("Logged out successfully"))
    }
    catch (err) {
        console.error(err);
        return res.status(500).json(
            errorResponse("Server error")
        );
    }
};