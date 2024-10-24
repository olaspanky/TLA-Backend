// // import mongoose, { Schema } from "mongoose";

// // const taskSchema = new Schema(
// //   {
// //     title: { type: String, required: true },
// //     date: { type: Date, default: new Date() },
// //     priority: {
// //       type: String,
// //       default: "normal",
// //       enum: ["high", "medium", "normal", "low"],
// //     },
// //     stage: {
// //       type: String,
// //       default: "todo",
// //       enum: ["todo", "in progress", "completed"],
// //     },
// //     activities: [
// //       {
// //         type: {
// //           type: String,
// //           default: "assigned",
// //           enum: [
// //             "assigned",
// //             "started",
// //             "in progress",
// //             "bug",
// //             "completed",
// //             "commented",
// //           ],
// //         },
// //         activity: String,
// //         date: { type: Date, default: new Date() },
// //         by: { type: Schema.Types.ObjectId, ref: "User" },
// //       },
// //     ],

// //     subTasks: [
// //       {
// //         title: String,
// //         date: Date,
// //         tag: String,
// //         stage: {
// //           type: String,
// //           default: "todo",
// //           enum: ["todo", "in progress", "completed"],
// //         },
// //       },
// //     ],
// //     assets: [String],
// //     team: [{ type: Schema.Types.ObjectId, ref: "User" }],
// //     isTrashed: { type: Boolean, default: false },
// //   },
// //   { timestamps: true }
// // );

// // const Task = mongoose.model("Task", taskSchema);

// // export default Task;
// import mongoose, { Schema } from "mongoose";

// const taskSchema = new Schema(
//   {
//     title: { type: String, required: true },
//     date: { type: Date, default: new Date() },  // Sets the date to current date by default
//     priority: {
//       type: String,
//       default: "normal",
//       enum: ["high", "medium", "normal", "low"], // Enum restricts values
//     },
//     stage: {
//       type: String,
//       default: "todo",
//       enum: ["todo", "in progress", "completed"], // Enum restricts values
//     },
//     activities: [
//       {
//         type: {
//           type: String,
//           default: "assigned",
//           enum: [
//             "assigned",
//             "started",
//             "in progress",
//             "bug",
//             "completed",
//             "commented",
//           ], // Enum for activity type
//         },
//         activity: String,  // Describes the activity itself
//         date: { type: Date, default: new Date() },  // Activity date defaults to current date
//         by: { type: Schema.Types.ObjectId, ref: "User" }, // Reference to the User who performed the activity
//       },
//     ],
//     subTasks: [
//       {
//         title: String,  // Title of the subtask
//         date: { type: Date, default: new Date() },  // Subtask date defaults to current date
//         tag: String,  // Any tag for the subtask
//         stage: {
//           type: String,
//           default: "todo",
//           enum: ["todo", "in progress", "completed"], // Enum restricts values
//         },
//       },
//     ],
//     assets: [String],  // List of asset URLs or names (array of strings)
//     team: [{ type: Schema.Types.ObjectId, ref: "User" }], // List of team members (User references)
//     isTrashed: { type: Boolean, default: false },  // Trash flag for soft deletion
//   },
//   { timestamps: true }  // Automatically adds `createdAt` and `updatedAt` fields
// );

// const Task = mongoose.model("Task", taskSchema);

// export default Task;
import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, default: new Date() },
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
        date: { type: Date, default: new Date() },
        by: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    subTasks: [
      {
        title: { type: String, required: true },  // Ensure title is required
        date: { type: Date, default: () => new Date() },  // Wrap in function for a fresh date per subtask
        tag: { type: String, required: true },  // Ensure tag is required or remove if optional
        stage: {
          type: String,
          default: "todo",
          enum: ["todo", "in progress", "completed"],  // Valid stages
        },
        objectives: [  // Array of objectives for each subtask
          {
            description: { type: String, required: false },  // Ensure each objective has a description
            status: {
              type: String,
              default: "todo",
              enum: ["todo", "in progress", "completed"],  // Valid statuses for each objective
            },
          },
        ],
      },
    ],
    
    assets: [String],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isTrashed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
