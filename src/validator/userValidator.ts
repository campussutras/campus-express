import { z } from "zod";

export const userSignupValidator = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  password: z.string(),
  profileType: z.enum(["Student", "Employee"]),
  institute: z.string().optional(),
  course: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  localAddress: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const userLoginValidator = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const userChangePasswordValidator = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
});

// Define a Zod schema for user update
export const userUpdateValidator = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  profileType: z.enum(["Student", "Employee"]).nullable().optional(),
  institute: z.string().optional(),
  course: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  localAddress: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export const emailValidator = z.object({
  email: z.string().email(),
});

// Define a Zod schema for contact

export const contactUsValidator = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  collegeName: z.string().optional(),
  message: z.string(),
});

// Define a Zod Schema for enrollment
export const enrollmentValidator = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  course: z.string(),
});

export const internshipValidator = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  college: z.string(),
  course: z.string(),
});
