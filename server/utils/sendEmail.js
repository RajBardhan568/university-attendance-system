const Brevo = require('@getbrevo/brevo');

const sendEmail = async (email, subject, text) => {
  // Brevo client instance
  const apiInstance = new Brevo.TransactionalEmailsApi();
  
  // API key configure karein
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  // Yahan inbox me naam "Attendance Management System" show hoga
  sendSmtpEmail.sender = { 
    name: "Attendance Management System", 
    email: process.env.FROM_EMAIL || "rajbardhan568@gmail.com" 
  };

  sendSmtpEmail.to = [{ email: email }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.textContent = text;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email successfully sent via Brevo to:", email);
    return data;
  } catch (error) {
    console.error("❌ Brevo API Error:", error.response ? error.response.body : error.message);
    throw error;
  }
};

module.exports = sendEmail;