import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { saveAssessmentValidator } from "../validator/assessmentValidator";
import { z } from "zod";

const prisma = new PrismaClient();

export const saveAssessment = async (req: Request, res: Response) => {
  try {
    const { name, duration, score, format } = saveAssessmentValidator.parse(
      req.body
    );

    // Verify token
    const token = req.userToken;

    if (!token) {
      return res.status(401).json({ error: "Token not found" });
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        name,
        duration,
        score,
        format,
        userId: token.id,
      },
    });

    return res
      .status(201)
      .json({ data: assessment, message: "Assessment created successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error
      return res.status(400).json({ error: "Invalid request body" });
    } else {
      // Other errors
      console.error("Error saving assessment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const getAllAssessments = async (req: Request, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      select: {
        name: true,
        duration: true,
        score: true,
        format: true,
        createdAt: true,

        user: {
          select: {
            id: true,
            name: true,
            profileType: true,
            company: true,
            institute: true,
            email: true,
            phone: true,
          },
        },
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

export const getAdminUserAssessments = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Early return for missing userId
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    // Fetch assessments efficiently (consider filtering by additional criteria)
    const assessments = await prisma.assessment.findMany({
      where: { userId }, // Destructuring assignment
      select: {
        id: true,
        name: true,
        duration: true,
        score: true,
        format: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
      }, // Include essential fields (adjust as needed) }, // Optional: select specific fields
    });

    // Handle case where no assessments are found
    if (!assessments || assessments.length === 0) {
      return res
        .status(200)
        .json({ data: [], message: "No assessments found for user" }); // Informative message
    }

    return res
      .status(200)
      .json({ data: assessments, message: "User assessments fetched!" });
  } catch (error) {
    console.error("Error fetching user assessments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyAssessments = async (req: Request, res: Response) => {
  const decodedToken = req.userToken;

  try {
    const assessments = await prisma.assessment.findMany({
      where: { userId: decodedToken.id },
      select: {
        name: true,
        duration: true,
        score: true,
        format: true,
        createdAt: true,
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
