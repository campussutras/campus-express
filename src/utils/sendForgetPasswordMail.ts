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

export const sendForgetPasswordMail = async ({
  forgetPasswordToken,
  email,
}: {
  forgetPasswordToken: string;
  email: string;
}) => {
  try {
    const html = `<!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Campus Sutras - Forget Password Link</title>
      
    </head>
    <body>
    <p>Click on below link to change your password of Campus Sutras.</p><br/>
    <p>Valid upto 15 minutes only</p><br/>
    <a href="http://localhost:5173/reset/${forgetPasswordToken}">localhost:5173/reset/${forgetPasswordToken}</a>
    </body>
    </html>`;

    const plainText = convert(html);
    const mailOptions = {
      from: `"Campus Sutras" ${process.env.MAIL_USER}`,
      to: `${email}`,
      subject: `Forget Password - Campus Sutras`,
      text: plainText,
      html,
    };
    const mailResponse = await transporter.sendMail(mailOptions);
    console.log("Verification code sent:", mailResponse.messageId);
  } catch (error) {
    console.error("Forget password email:", error);
    throw error; // Re-throw to propagate the error
  }
};
