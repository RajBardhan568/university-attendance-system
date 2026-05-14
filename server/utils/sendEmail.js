const sgMail = require('@sendgrid/mail');

const sendEmail = async (email, subject, text) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email, 
    from: process.env.FROM_EMAIL, // This MUST match the email in your screenshot
    subject: subject,
    text: text,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ API Email sent successfully via SendGrid");
  } catch (error) {
    console.error("❌ SendGrid Error:");
    if (error.response) {
      console.error(error.response.body);
    } else {
      console.error(error.message);
    }
  }
};

module.exports = sendEmail;