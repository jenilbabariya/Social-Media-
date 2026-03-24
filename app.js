import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import indexRoutes from "./src/routes/index.routes.js";
import path from "path";
import { startScheduledPostJob } from "./src/jobs/publishScheduled.job.js";
import errorHandler from "./src/middlewares/error.middleware.js";

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdn.socket.io", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://*.socket.io", "ws://localhost:*", "https://*"],
        imgSrc: ["'self'", "data:", "blob:", "https://ui-avatars.com", "https://*.google.com", "https://*"],
        mediaSrc: ["'self'", "blob:", "https://*"],
      },
    },
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(morgan("dev"));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("./public"));
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use(indexRoutes);
app.use(errorHandler);

startScheduledPostJob();

export default app;