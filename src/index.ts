import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
// import adminRouter from "./routes/adminRoutes";
import userRouter from "./routes/userRoutes";
import assessRouter from "./routes/assessmentRoutes";
import compression from "compression";

// config dotenv
// env file used for environment variables
dotenv.config();
const app = express();
app.use(compression());

const PORT = process.env.PORT || 3001;

// Security middleware setup
app.use(helmet()); // Protect against common vulnerabilities
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit requests to 100 per window
  })
); // Limit excessive requests

// Middleware setup
app.use(express.json({ limit: "16kb" })); // Parse JSON data with limit
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded data with limit
app.use(cookieParser());

// setting up allowed routes
const allowedOrigins = [
  "https://campussutras.com",
  "https://app.campussutras.com",
  "https://www.campussutras.com",
  "https://www.app.campussutras.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
); // Enable CORS with restrictions
app.use(morgan("tiny"));

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/assessment", assessRouter);
app.get("/", (req, res) => {
  res.send("Hello Harshit");
});

app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
});

// server.keepAliveTimeout = 65000;
