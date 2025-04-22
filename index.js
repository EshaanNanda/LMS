import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

import hpp from "hpp";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
//global rste limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutes
  limit: 100, //limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

//security middleware
app.use(mongoSanitize()); //sanitize data to prevent NoSQL injection
app.use(helmet()); //set security HTTP headers
app.use(hpp()); //prevent HTTP param pollution
app.use("/api", limiter); //apply to all bckend requests
//parse cookies

//logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//body parsing middlewares
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

//global handler for uncaught exceptions
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...PORT(process.env.NODE_ENV === "developement" && { stack: err.stack }),
  });
});

//CORS config
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, //allow credentials
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"], //allow methods
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
    ], //allow headers
  })
);

//api routes

//its a 404bhandler
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});
