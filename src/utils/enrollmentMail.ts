import nodemailer from "nodemailer";
const { convert } = require("html-to-text");

interface EnrollmentData {
  fullName: String;
  email: String;
  phone: String;
  course: String;
}

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

export const sendEnrollmentData = async ({ ...params }: EnrollmentData) => {
  try {
    const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Sutras - Enrollment Details</title>
  <style>
    body {
      background-color: #f5f5f5; /* Light gray background */
      font-family: Arial, sans-serif; /* Default font */
      margin: 0;
      padding: 0;
    }

    .container {
      width: 600px; /* Max width for responsiveness */
      margin: 0 auto; /* Center content horizontally */
      padding: 20px; /* Padding for content */
      background-color: #fff; /* White background for content area */
      border: 1px solid #ddd; /* Light border for content area */
      border-radius: 5px; /* Rounded corners for content area */
    }

    h1 {
      color: #002255; /* Primary color for headings */
      font-size: 24px; /* Heading size */
      margin: 0; /* Remove top margin */
      padding: 10px 0; /* Top and bottom padding */
      border-bottom: 1px solid #ddd; /* Light border under heading */
    }

    p {
      font-size: 16px; /* Content text size */
      line-height: 1.5; /* Line spacing */
      margin: 10px 0; /* Margin between paragraphs */
      color: #27272a; /* Content text color */
    }

    a {
      color: #8ea3b1; /* Link color */
      text-decoration: none; /* Remove underline from links */
    }

    a:hover {
      color: #002255; /* Change link color on hover */
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Campus Sutras - Contact Details</h1>
    <p><strong>Full Name:</strong> ${params.fullName}</p>
    <p><strong>Email:</strong> ${params.email}</p>
    <p><strong>Phone:</strong> ${params.phone}</p>
    <p><strong>Course:</strong> ${params.course}</p>
  </div>
</body>
</html>`;

    const plainText = convert(html);
    const mailOptions = {
      from: `"Campus Sutras" ${process.env.MAIL_USER}`,
      to: `info@campussutras.com, harshit.kumar@campussutras.com`,
      subject: `Course Enrollment Details - Campus Sutras`,
      text: plainText,
      html,
    };
    const mailResponse = await transporter.sendMail(mailOptions);
    console.log("Enrollment Details sent:", mailResponse.messageId);
  } catch (error) {
    console.error("Contact Data:", error);
    throw error; // Re-throw to propagate the error
  }
};

export const sendEnrollmentDataStudent = async ({
  ...params
}: EnrollmentData) => {
  try {
    const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Sutras - Thank You For Enrollment</title>
  <style>
    body {
      background-color: #f5f5f5; /* Light gray background */
      font-family: Arial, sans-serif; /* Default font */
      margin: 0;
      padding: 0;
    }

    .container {
      width: 600px; /* Max width for responsiveness */
      margin: 0 auto; /* Center content horizontally */
      padding: 20px; /* Padding for content */
      background-color: #fff; /* White background for content area */
      border: 1px solid #ddd; /* Light border for content area */
      border-radius: 5px; /* Rounded corners for content area */
    }

    h1 {
      color: #002255; /* Primary color for headings */
      font-size: 24px; /* Heading size */
      margin: 0; /* Remove top margin */
      padding: 10px 0; /* Top and bottom padding */
    font-weight: 500;
    }

    p {
      font-size: 16px; /* Content text size */
      line-height: 1.5; /* Line spacing */
      margin: 10px 0; /* Margin between paragraphs */
      color: #27272a; /* Content text color */
    }

    a {
      color: #8ea3b1; /* Link color */
      text-decoration: none; /* Remove underline from links */
    }

    a:hover {
      color: #002255; /* Change link color on hover */
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Thank You ${params.fullName} 🎉🎉</h1>
    <p>For Enrolling <strong>${params.course}</strong> Course</p>
    <p>Our team will get back to you shortly.</p>
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team at info@campussutras.com.</p>
  </div>
</body>
</html>
</html>`;

    const plainText = convert(html);
    const mailOptions = {
      from: `"Campus Sutras" ${process.env.MAIL_USER}`,
      to: `${params.email}`,
      subject: `Thank You For Enrolling ${params.course}`,
      text: plainText,
      html,
    };
    const mailResponse = await transporter.sendMail(mailOptions);
    console.log("Enrollment Details sent:", mailResponse.messageId);
  } catch (error) {
    console.error("Contact Data:", error);
    throw error; // Re-throw to propagate the error
  }
};
