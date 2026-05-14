const bcrypt = require('bcryptjs'); // Add this at the top of auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../cloudinaryConfig');
const sendEmail = require('../utils/sendEmail');

// --- HELPER: GENERATE 6-DIGIT OTP ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. REGISTER USER
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { name, email, role } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });

        const otp = generateOTP();

        const newUser = new User({
            ...req.body,
            verificationToken: otp, 
            isVerified: false,
            // Only save photo path if it's a student and file exists
            profilePhoto: (role === 'student' && req.file) ? req.file.path : ''
        });

        await newUser.save();
// sendOTPEmail(email, otp);
        await sendEmail(
            email,
            "Your Verification Code",
            `Hello ${name}, your verification code is: ${otp}. It expires in 10 minutes.`
        );

        res.status(201).json({ message: "User registered. OTP sent." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. VERIFY REGISTRATION OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email, verificationToken: otp });

        if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

        user.isVerified = true;
        user.verificationToken = undefined; // Clear OTP after success
        await user.save();

        res.json({ message: "Account verified successfully! You can now login." });
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// 3. LOGIN ROUTE
// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        if (!user.isVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationToken = otp;
            await user.save();

            await sendEmail(user.email, "Verify Your Account", `Your code is: ${otp}`);
            return res.status(403).json({ error: "Please verify your email before logging in." });
        }

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. FORGOT PASSWORD - STEP 1: Send OTP
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const otp = generateOTP();
        
        const user = await User.findOneAndUpdate(
            { email },
            { 
                resetPasswordToken: otp, 
                resetPasswordExpires: Date.now() + 600000 // 10 Min Expiry
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        await sendEmail(email, "Password Reset OTP", `Your password reset code is: ${otp}`);
        res.json({ message: "Reset OTP sent to your email!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send reset OTP" });
    }
});

// 5. FORGOT PASSWORD - STEP 2: Verify OTP & Set New Password
router.post("/reset-password-otp", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Find user with matching email, valid OTP, and unexpired time
        const user = await User.findOne({
            email,
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

        user.password = newPassword; 
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Reset failed" });
    }
});

router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.isVerified) return res.status(400).json({ error: "Already verified" });

        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = newOtp;
        await user.save();

        await sendEmail(email, "Your New Verification Code", `Your new code is: ${newOtp}`);
        res.json({ message: "New OTP sent to your email!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to resend OTP" });
    }
});



module.exports = router;