const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email sending error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    console.log("Email SMTP connection verified successfully");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Email SMTP connection failed:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  sendEmail,
  verifyEmailConnection,
};