// import bcrypt from "bcryptjs";
// import mongoose, { Schema } from "mongoose";

// const userSchema = new Schema(
//   {
//     name: { type: String, required: true },
//     title: { type: String, required: true },
//     role: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     isAdmin: { type: Boolean, required: true, default: false },
//     tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
//     isActive: { type: Boolean, required: true, default: true },
//   },
//   { timestamps: true }
// );

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model("User", userSchema);

// export default User;
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// Hash password and security answer before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified("securityAnswer")) {
    const salt = await bcrypt.genSalt(10);
    this.securityAnswer = await bcrypt.hash(this.securityAnswer, salt);
  }
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare security answer
userSchema.methods.matchSecurityAnswer = async function (enteredAnswer) {
  return await bcrypt.compare(enteredAnswer, this.securityAnswer);
};

const User = mongoose.model("User", userSchema);

export default User;
