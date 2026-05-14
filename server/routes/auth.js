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
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        
        // 1. Find if the user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // IF USER EXISTS BUT IS NOT VERIFIED: Allow them to "re-register"
            if (!existingUser.isVerified) {
                const otp = generateOTP();
                
                // Update the unverified user with new details (in case they made a typo)
                existingUser.name = name;
                existingUser.password = password; // The Model middleware will hash this
                existingUser.verificationToken = otp;
                existingUser.role = role;
                if (role === 'student' && req.file) {
                    existingUser.profilePhoto = req.file.path;
                }
                
                await existingUser.save();

                // Send email in background (No 'await' = Instant UI)
                sendEmail(
                    email,
                    "Your New Verification Code",
                    `Hello ${name}, your new code is: ${otp}`
                ).catch(err => console.error("Re-register Email Error:", err));

                return res.status(201).json({ message: "Unverified account found. New OTP sent." });
            } 
            
            // IF USER EXISTS AND IS ALREADY VERIFIED: Block them
            return res.status(400).json({ error: "Email already registered and verified. Please login." });
        }

        // IF USER DOES NOT EXIST AT ALL: Create new
        const otp = generateOTP();
        const newUser = new User({
            ...req.body,
            verificationToken: otp, 
            isVerified: false,
            profilePhoto: (role === 'student' && req.file) ? req.file.path : ''
        });

        await newUser.save();

        // Send email in background (No 'await' = Instant UI)
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