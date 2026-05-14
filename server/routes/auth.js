const bcrypt = require('bcryptjs'); 
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const upload = require('../cloudinaryConfig');
const sendEmail = require('../utils/sendEmail');

// --- HELPER: GENERATE 6-DIGIT OTP ---
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. REGISTER USER
// 1. REGISTER USER
// 1. REGISTER USER
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { name, email, role, password, mobile, regNo } = req.body;
        
        // --- 1. STRICT MULTI-FIELD VALIDATION ---
        // Check if ANY of the unique fields are already verified in the system
        const existingVerifiedUser = await User.findOne({
            $or: [
                { email: email },
                { mobile: mobile },
                ...(role === 'student' ? [{ regNo: regNo }] : []) // Only check regNo for students
            ],
            isVerified: true
        });

        if (existingVerifiedUser) {
            let conflictField = "Email";
            if (existingVerifiedUser.mobile === mobile) conflictField = "Mobile number";
            if (role === 'student' && existingVerifiedUser.regNo === regNo) conflictField = "Registration number";
            
            return res.status(400).json({ 
                error: `${conflictField} is already registered to a verified account.` 
            });
        }

        // --- 2. HANDLE UNVERIFIED RE-REGISTRATION ---
        // If an unverified account exists with this email, allow update
        const unverifiedUser = await User.findOne({ email, isVerified: false });

        if (unverifiedUser) {
            const otp = generateOTP();
            
            unverifiedUser.name = name;
            unverifiedUser.password = password; 
            unverifiedUser.mobile = mobile;
            unverifiedUser.regNo = regNo;
            unverifiedUser.verificationToken = otp;
            unverifiedUser.role = role;
            if (role === 'student' && req.file) {
                unverifiedUser.profilePhoto = req.file.path;
            }
            
            await unverifiedUser.save();

            sendEmail(
                email,
                "Your New Verification Code",
                `Hello ${name}, your new code is: ${otp}`
            ).catch(err => console.error("Re-register Email Error:", err));

            return res.status(201).json({ message: "Unverified account found. New OTP sent." });
        }

        // --- 3. CREATE TOTALLY NEW USER ---
        const otp = generateOTP();
        const newUser = new User({
            ...req.body,
            verificationToken: otp, 
            isVerified: false,
            profilePhoto: (role === 'student' && req.file) ? req.file.path : ''
        });

        await newUser.save();

        sendEmail(
            email,
            "Your Verification Code",
            `Hello ${name}, your verification code is: ${otp}.`
        ).catch(err => console.error("Registration Email Error:", err));

        res.status(201).json({ message: "User registered. OTP sent." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. VERIFY REGISTRATION OTP (No changes needed)
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email, verificationToken: otp });

        if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

        user.isVerified = true;
        user.verificationToken = undefined; 
        await user.save();

        res.json({ message: "Account verified successfully! You can now login." });
    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ error: "Invalid Email or Password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid Email or Password" });

        if (!user.isVerified) {
            const otp = generateOTP();
            user.verificationToken = otp;
            await user.save();

            // UPDATE: Removed 'await'
            sendEmail(user.email, "Verify Your Account", `Your code is: ${otp}`)
                .catch(err => console.error("Login Email Error:", err));

            return res.status(403).json({ error: "Please verify your email before logging in." });
        }

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const otp = generateOTP();
        
        const user = await User.findOneAndUpdate(
            { email },
            { 
                resetPasswordToken: otp, 
                resetPasswordExpires: Date.now() + 600000 
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: "User not found" });

        // UPDATE: Removed 'await'
        sendEmail(email, "Password Reset OTP", `Your password reset code is: ${otp}`)
            .catch(err => console.error("Forgot Pass Email Error:", err));

        res.json({ message: "Reset OTP sent to your email!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to send reset OTP" });
    }
});

// 5. RESET PASSWORD (No changes needed)
router.post("/reset-password-otp", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
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

// 6. RESEND OTP
router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.isVerified) return res.status(400).json({ error: "Already verified" });

        const newOtp = generateOTP();
        user.verificationToken = newOtp;
        await user.save();

        // UPDATE: Removed 'await'
        sendEmail(email, "Your New Verification Code", `Your new code is: ${newOtp}`)
            .catch(err => console.error("Resend Email Error:", err));

        res.json({ message: "New OTP sent to your email!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to resend OTP" });
    }
});

module.exports = router;