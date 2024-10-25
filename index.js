// import cookieParser from "cookie-parser";
// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import morgan from "morgan";
// import { errorHandler, routeNotFound } from "./middlewares/errorMiddlewaves.js";
// import routes from "./routes/index.js";
// import { dbConnection } from "./utils/index.js";

// dotenv.config();

// dbConnection();

// const PORT = process.env.PORT || 5000;

// const app = express();

// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:3001", "https://tla-two.vercel.app/"],
//     methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"], // Add OPTIONS method
//     credentials: true,
//   })
// );

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Welcome to the API!' });
// });

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(cookieParser());

// app.use(morgan("dev"));
// app.use("/api", routes);

// app.use(routeNotFound);
// app.use(errorHandler);

// app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { errorHandler, routeNotFound } from "./middlewares/errorMiddlewaves.js";
import routes from "./routes/index.js";
import { dbConnection } from "./utils/index.js";

dotenv.config();
dbConnection();

const PORT = process.env.PORT || 5000;

const app = express();

// Enable CORS with corrected settings
app.use(
  cors({
    origin: ["http://localhost:3000", "https://tla-two.vercel.app"],
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    credentials: true,
  })
);

// Handle
app.options('*', cors()); // Allow preflight requests for all routes

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Pbr API!' });
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api", routes);

// Error handling middleware
app.use(routeNotFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
