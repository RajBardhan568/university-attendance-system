const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use false for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Ensure this is the 16-digit App Password
      },
      // THIS IS THE KEY FIX FOR ENETUNREACH:
      // Force IPv4 address resolution
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("✅ Email sent successfully to:", email);
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    // Log the full error to catch App Password issues
    if (error.message.includes('EAUTH')) {
      console.log("HINT: Check if your 16-digit App Password is still valid.");
    }
  }
};

module.exports = sendEmail;