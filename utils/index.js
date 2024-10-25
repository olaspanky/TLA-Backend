// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";

// export const dbConnection = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);

//     console.log("DB connection established");
//   } catch (error) {
//     console.log("DB Error: " + error);
//   }
// };

// export const createJWT = (res, userId) => {
//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: "1d",
//   });

//   // Change sameSite from strict to none when you deploy your app
//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV !== "development",
//     SameSite: "strict", //prevent CSRF attack
//     maxAge: 1 * 24 * 60 * 60 * 1000, //1 day
//   });
// };
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connection established");
  } catch (error) {
    console.log("DB Error: " + error);
  }
};

export const createJWT = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction, // Must be true in production for HTTPS
    sameSite: isProduction ? 'none' : 'lax', // Must be 'none' for cross-site cookies
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};