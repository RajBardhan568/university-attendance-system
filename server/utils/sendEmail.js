const brevo = require('@getbrevo/brevo');

const sendEmail = async (email, subject, text) => {
  // 1. Brevo client setup
  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  // 2. Email payload
  const sendSmtpEmail = new brevo.SendSmtpEmail();

  // Yahan se student ko dikhega: "Attendance Management System"
  sendSmtpEmail.sender = { 
    name: "Attendance Management System", 
    email: process.env.FROM_EMAIL || "rajbardhan568@gmail.com" // Wahi Gmail jo Brevo me registered/verified hai
  };

  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.textContent = text;

  // 3. Send email
  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ OTP successfully sent to:", email);
    return response;
  } catch (error) {
    console.error("❌ Brevo Error:", error.response ? error.response.body : error.message);
    throw error;
  }
};

module.exports = sendEmail;