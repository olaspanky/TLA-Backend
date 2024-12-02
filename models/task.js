
import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, default: () => new Date() },
    priority: {
      type: String,
      default: "normal",
      enum: ["high", "medium", "normal", "low"],
    },
    stage: {
      type: String,
      default: "todo",
      enum: ["todo", "in progress", "completed"],
    },
    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: [
            "assigned",
            "started",
            "in progress",
            "bug",
            "completed",
            "commented",
          ],
        },
        activity: String,
        date: { type: Date, default: () => new Date() },
        by: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    subTasks: [
      {
        title: { type: String, required: true }, // Subtask title
        date: { type: Date, default: () => new Date() }, // Subtask creation date
        tag: { type: String, required: true }, // Subtask tag
        stage: {
          type: String,
          default: "todo",
          enum: ["todo", "in progress", "completed"], // Subtask stage
        },
        objectives: [
          {
            description: { type: String, required: false }, // Objective description
            status: {
              type: String,
              default: "todo",
              enum: ["todo", "in progress", "completed"], // Objective status
            },
          },
        ],
        comments: [
          {
            text: String,
            rating: Number, // e.g., 1-5 scale
            reaction: String, // e.g., "like", "disagree"
            author: String, // Reference to a user
            timestamp: { type: Date, default: Date.now },
          },
        ],
        startDate: { type: Date, required: false }, // Subtask start date
        completionDate: { type: Date, required: false }, // Subtask completion date
        team: [{ type: Schema.Types.ObjectId, ref: "User" }], // Team assigned to subtask
      },
    ],
    assets: [String],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }], // Main task team
    isTrashed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
