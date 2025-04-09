import { z } from "zod";

export const adminSignupValidator = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  password: z.string(),
  isAdmin: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  users: z.array(z.string()), // Assuming User model has a string id
  assessments: z.array(z.string()), // Assuming Assessment model has a string id
  createdAt: z.string(), // Assuming createdAt is a string in ISO 8601 format
  updatedAt: z.string(), // Assuming updatedAt is a string in ISO 8601 format
});

export const adminLoginValidator = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const adminChangePasswordValidator = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
});
