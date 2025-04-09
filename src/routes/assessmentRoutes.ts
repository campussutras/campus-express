import express from "express";
import {
  getAdminUserAssessments,
  getAllAssessments,
  getMyAssessments,
  saveAssessment,
} from "../controllers/assessmentController";
import { authCheck } from "../middlewares/auth";
import { adminCheck } from "../middlewares/adminAuth";

const assessRouter = express.Router();

assessRouter.post("/save-assessment", authCheck, saveAssessment);
assessRouter.get("/get-assessments", authCheck, getAllAssessments);
assessRouter.get("/user-assessments/:id", getAdminUserAssessments);
assessRouter.get("/my-assessments", authCheck, getMyAssessments);

export default assessRouter;
