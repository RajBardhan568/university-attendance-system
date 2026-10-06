const axios = require('axios');

const sendEmail = async (email, subject, text) => {
  const data = {
    sender: {
      name: "Attendance Management System",
      email: process.env.FROM_EMAIL || "rajbardhan568@gmail.com"
    },
    to: [
      {
        email: email
      }
    ],
    subject: subject,
    textContent: text
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      }
    });

    console.log("✅ Email successfully sent via Brevo to:", email);
    return response.data;
  } catch (error) {
    console.error("❌ Brevo API Error:", error.response ? error.response.data : error.message);
    throw error;
  }
};

module.exports = sendEmail;