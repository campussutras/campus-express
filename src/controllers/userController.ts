import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import {
  contactUsValidator,
  emailValidator,
  enrollmentValidator,
  internshipValidator,
  userChangePasswordValidator,
  userLoginValidator,
  userSignupValidator,
  userUpdateValidator,
} from "../validator/userValidator";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { sendVerificationCode } from "../utils/sendVerificationEmail";
import { sendForgetPasswordMail } from "../utils/sendForgetPasswordMail";
import EventEmitter from "events";
import { sendContactData } from "../utils/sendContactData";
import {
  sendEnrollmentData,
  sendEnrollmentDataStudent,
} from "../utils/enrollmentMail";
import {
  sendInternshipData,
  sendInternshipDataStudent,
} from "../utils/internshipMail";
const userEmitter = new EventEmitter();

const prisma = new PrismaClient();
const saltRounds = 10;

interface AccessToken {
  id: string;
  isVerified: boolean;
  isAdmin: boolean;
}

const generateAccessToken = ({ id, isVerified, isAdmin }: AccessToken) => {
  return jwt.sign(
    {
      id: id,
      isVerified: isVerified,
      isAdmin: isAdmin,
    },
    // @ts-ignore
    process.env.ACCESS_TOKEN_KEY,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

/* --------------------user signup-------------------- */

export const userSignup = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { name, email, phone, password, profileType } =
      userSignupValidator.parse(req.body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        profileType,
      },
    });

    const accessToken = await generateAccessToken({
      id: user.id,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
    });

    res.cookie(`campus`, accessToken, {
      sameSite: "lax",
      secure: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in milliseconds
    });
    userEmitter.emit("sendVerificationEmail", {
      id: user.id,
      email: user.email,
    });
    // Return success response
    return res
      .status(201)
      .json({ data: user, message: "User created successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error
      return res.status(400).json({ error: "Invalid request body" });
    } else {
      // Other errors
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

/* --------------------user login-------------------- */

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = userLoginValidator.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      // Use constant time comparison to mitigate timing attacks
      await bcrypt.compare("dummyPassword", user.password); // Ensure that both hash and dummy hash are calculated
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const accessToken = await generateAccessToken({
      id: user.id,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
    });

    res.cookie(`campus`, accessToken, {
      sameSite: "lax",
      secure: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in milliseconds
    });
    return res.status(200).json({
      data: user,
      message: "Login success",
    });
  } catch (error) {
    console.error("Error during user login:", error);
    if (error instanceof z.ZodError) {
      // Validation error
      return res.status(400).json({ error: "Invalid request body" });
    } else {
      // Other errors
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

/* --------------------user profile-------------------- */

export const getUser = async (req: Request, res: Response) => {
  try {
    const decodedToken = req.userToken;

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileType: true,
        institute: true,
        course: true,
        company: true,
        position: true,
        localAddress: true,
        city: true,
        zip: true,
        state: true,
        country: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        assessments: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserAssessments = async (req: Request, res: Response) => {
  try {
    const decodedToken = req.userToken;
    const assessments = await prisma.assessment.findMany({
      where: { userId: decodedToken.id },
      select: {
        name: true,
        duration: true,
        score: true,
        format: true,
      },
    });

    return res
      .status(200)
      .json({ data: assessments, message: "Assessments fetched successfully" });
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const contactUs = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, collegeName, message } =
      contactUsValidator.parse(req.body);

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        collegeName,
        message,
      },
    });
    sendContactData({
      firstName,
      lastName,
      email,
      phone,
      collegeName,
      message,
    });
    return res.status(200).json({
      message: "Thank you for your query, Our team will contact you.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error
      return res.status(400).json({ error: "Invalid request body" });
    } else {
      // Other errors
      console.error("Error sending message:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const enrollment = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, course } = enrollmentValidator.parse(
      req.body
    );

    const enrollment = await prisma.enrollment.create({
      data: {
        fullName,
        email,
        phone,
        course,
      },
    });
    sendEnrollmentData({ fullName, email, phone, course });
    sendEnrollmentDataStudent({ fullName, email, phone, course });
    return res.status(200).json({
      message: `Thank you for enrolling ${course} course.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error
      return res.status(400).json({ error: "Invalid request body" });
    } else {
      // Other errors
      console.error("Error while enrollment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const internshipProgramRegistration = async (
  req: Request,
  res: Response
) => {
  try {
    const { fullName, email, phone, college, course } =
      internshipValidator.parse(req.body);

    await sendInternshipData({ fullName, email, phone, college, course });
    sendInternshipDataStudent({
      fullName,
      email,
      phone,
      college,
      course,
    });

    return res.status(200).json({
      message: `Thank you for registering ${course} course.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error
      return res.status(400).json({ error: "Invalid request body" });
    } else {
      // Other errors
      console.error("Error while internship program registration:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

/* --------------------admin get users-------------------- */

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileType: true,
        isVerified: true,
        createdAt: true,
        assessments: {
          select: {
            name: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json({ data: users, message: "Users fetched successfully" });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* --------------------get admin user-------------------- */

export const getAdminUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Early return if userId is missing
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    // Optimized user fetching with specific fields and eager loading
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, // Include ID for consistency
        name: true,
        email: true,
        phone: true,
        profileType: true,
        institute: true,
        course: true,
        company: true,
        position: true,
        localAddress: true,
        city: true,
        zip: true,
        state: true,
        country: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { assessments: true }, // Count assessments
        },
      },
    });

    // Handle user not found with a specific error message
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ data: user, message: "User Fetched" });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* --------------------user change password-------------------- */

export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const decodedToken = req.userToken;
    const { oldPassword, newPassword } = userChangePasswordValidator.parse(
      req.body
    );
    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    // If user doesn't exist
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update admin's password
    await prisma.user.update({
      where: { id: decodedToken.id },
      data: { password: hashedNewPassword },
    });

    // Clear the "campus" cookie
    res.clearCookie("campus");
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing admin password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* --------------------user update-------------------- */

export const userUpdate = async (req: Request, res: Response) => {
  try {
    const decodedToken = req.userToken;
    const {
      name,
      phone,
      profileType,
      institute,
      course,
      company,
      position,
      localAddress,
      city,
      zip,
      state,
      country,
    } = userUpdateValidator.parse(req.body);

    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });

    // If user doesn't exist
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decodedToken.id },
      data: {
        name,
        phone,
        profileType,
        institute,
        course,
        company,
        position,
        localAddress,
        city,
        zip,
        state,
        country,
      },
    });
    return res
      .status(200)
      .json({ data: updatedUser, message: "User details updated" });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* --------------------user logout-------------------- */

export const userLogout = (req: Request, res: Response) => {
  try {
    // Clear the "campus" cookie
    res.clearCookie("campus");
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendVerificatonCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email presence and format
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const verificationToken = await jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      // @ts-ignore
      process.env.VERIFICATION_TOKEN,
      {
        expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY,
      }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
      },
    });

    sendVerificationCode({ verificationToken, email });

    res.status(200).json({ message: "Verification link sent on your email" });
  } catch (error) {
    console.error("Error in verifying email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

function validateEmail(email: string): boolean {
  // Implement your preferred email validation logic here (e.g., using a library)
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

// verify email

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Missing verification token" });
    }

    try {
      // @ts-ignore
      const decoded = jwt.verify(token, process.env.VERIFICATION_TOKEN);
      const { id } = decoded; // Destructuring

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          verificationToken: null, // Set to null on verification
          isVerified: true, // Update verification status
        },
        select: { id: true }, // Only select necessary field
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "Invalid verification token" });
      }

      res.status(200).json({ message: "User verified" });
    } catch (error) {
      console.error("Error verifying email:", error);
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: "Verification token expired" });
      } else {
        return res.status(400).json({ error: "Invalid verification token" });
      }
    }
  } catch (error) {
    console.error("Error in verifying email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/* assign admin */

export const makeAdmin = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { isAdmin } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // If user doesn't exist
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isAdmin,
      },
    });

    return res
      .status(200)
      .json({ data: updatedUser, message: "Now you are admin" });
  } catch (error) {
    console.error("Error in assigning admin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// send forget password mail

export const sendForgetPasswordLink = async (req: Request, res: Response) => {
  try {
    // Extract email from request body using email-validator
    const { email } = emailValidator.parse(req.body);

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // If user not found, return error
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate forget password token
    const forgetPasswordToken = await jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      // @ts-ignore
      process.env.FORGET_PASSWORD_TOKEN,
      {
        expiresIn: process.env.FORGET_PASSWORD_TOKEN_EXPIRY,
      }
    );

    // Update user with forget password token
    await prisma.user.update({
      where: { email },
      data: {
        forgetPasswordToken,
      },
    });

    // Send forget password mail
    sendForgetPasswordMail({ forgetPasswordToken, email });

    // Send success response
    return res
      .status(200)
      .json({ message: "Forget Password link sent to your email" });
  } catch (error) {
    console.error("Forget password mail:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// forget password

export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Input Validation: Check if token is provided
    if (!token) {
      return res.status(400).json({ error: "Missing forget password token" });
    }
    try {
      // Verify token and extract user ID
      // @ts-ignore
      const decoded = jwt.verify(token, process.env.FORGET_PASSWORD_TOKEN);
      const { id } = decoded;

      // Hash the password
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user's password and clear forgetPasswordToken
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          forgetPasswordToken: null,
          password: hashedPassword,
        },
        select: { id: true },
      });

      // Check if user was updated successfully
      if (!updatedUser) {
        return res.status(404).json({ error: "Invalid token" });
      }

      // Send success response
      return res.status(200).json({ message: "New Password Set" });
    } catch (error) {
      console.error("Forget Password:", error);

      // Handle specific errors
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: "Token expired" });
      } else {
        return res.status(400).json({ error: "Invalid token" });
      }
    }
  } catch (error) {
    console.error("Forget Password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// events
userEmitter.on(
  "sendVerificationEmail",
  async ({ email, id }: { email: string; id: string }) => {
    try {
      const verificationToken = await jwt.sign(
        {
          id,
          email,
        },
        // @ts-ignore
        process.env.VERIFICATION_TOKEN,
        {
          expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY,
        }
      );

      await prisma.user.update({
        where: { id },
        data: {
          verificationToken,
        },
      });
      await sendVerificationCode({ verificationToken, email });
    } catch (error) {
      console.log(error);
    }
  }
);
