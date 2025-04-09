import nodemailer from "nodemailer";
const { convert } = require("html-to-text");

// Create transporter once and reuse
const transporter = nodemailer.createTransport({
  // @ts-ignore
  name: "mail.campussutras.com",
  host: "mail.campussutras.com",
  port: 465,
  secure: true,
  auth: {
    user: "noreply@campussutras.com",
    pass: "Campus@7505",
  },
  pool: true, // Enable connection pooling
});

export const sendVerificationCode = async ({
  verificationToken,
  email,
}: {
  verificationToken: string;
  email: string;
}) => {
  try {
    const html = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Sutras - Email Verification</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }

    .container {
      padding: 20px;
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #333;
    }

    p {
      font-size: 16px;
      line-height: 1.5;
      color: #666;
    }

    .link {
      display: inline-block;
      padding: 10px 20px;
      background-color: #3498db;
      color: #fff;
      text-decoration: none;
      border-radius: 5px;
    }

    .expiration-notice {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
    }
  </style>
</head>
<body>
<div class="container">
<h1>Welcome to Campus Sutras!</h1>
<p>To verify your email address, click on the link below:</p>
<a href="http://localhost:5173/verify/${verificationToken}" target="_blank" class="link">Verify Your Email</a>
<p class="expiration-notice">This verification link expires in 15 minutes.</p>
</div>
</body>
</html>`;
    const plainText = convert(html); // Optional plain text fallback
    const mailOptions = {
      from: `"Campus Sutras" ${process.env.MAIL_USER}`,
      to: `${email}`,
      subject: `Verification Code - Campus Sutras`,
      text: plainText,
      html,
    };
    const mailResponse = await transporter.sendMail(mailOptions);
    console.log("Verification code sent:", mailResponse.messageId);
    return mailResponse;
  } catch (error) {
    console.error("Error sending verifiaction code:", error);
    throw error; // Re-throw to propagate the error
  }
};
