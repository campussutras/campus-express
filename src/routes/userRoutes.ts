import express from "express";
import {
  changeUserPassword,
  contactUs,
  enrollment,
  forgetPassword,
  getAdminUser,
  getAllUsers,
  getUser,
  getUserAssessments,
  internshipProgramRegistration,
  makeAdmin,
  sendForgetPasswordLink,
  sendVerificatonCode,
  userLogin,
  userLogout,
  userSignup,
  userUpdate,
  verifyEmail,
} from "../controllers/userController";
import { authCheck } from "../middlewares/auth";

const userRouter = express.Router();

userRouter.post("/signup", userSignup);
userRouter.post("/login", userLogin);
userRouter.get("/profile", authCheck, getUser);
userRouter.get("/assessments", authCheck, getUserAssessments);
userRouter.get("/get-users", authCheck, getAllUsers);
userRouter.get("/get-user/:id", authCheck, getAdminUser);
userRouter.patch("/change-password", authCheck, changeUserPassword);
userRouter.patch("/update", authCheck, userUpdate);
userRouter.get("/logout", userLogout);
userRouter.patch("/send-verification-code", sendVerificatonCode);
userRouter.patch("/forget-password", sendForgetPasswordLink);
userRouter.patch("/forget-change-password/:token", forgetPassword);
userRouter.patch("/verify-email/:token", verifyEmail);

userRouter.patch(
  "/make-admin/c08b9cb546eacc9076db51e2c0eb5196d82049d5aca8ab39f79096af6a07f204/:id",
  makeAdmin
);

userRouter.post("/contact", contactUs);
userRouter.post("/enrollment", enrollment);
userRouter.post("/internship", internshipProgramRegistration);

export default userRouter;
