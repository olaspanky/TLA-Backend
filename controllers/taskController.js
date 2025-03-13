import Notice from "../models/notification.js";
import Task from "../models/task.js";
import User from "../models/user.js";

export const createTask = async (req, res) => {
  try {
    const { userId } = req.user;

    const { title, team, stage, date, priority, assets } = req.body;

    let text = "New task has been assigned to you";
    if (team?.length > 1) {
      text = text + ` and ${team?.length - 1} others.`;
    }

    text =
      text +
      ` The task priority is set a ${priority} priority, so check and act accordingly. The task date is ${new Date(
        date
      ).toDateString()}. Thank you!!!`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };

    const task = await Task.create({
      title,
      team,
      stage: stage.toLowerCase(),
      date,
      priority: priority.toLowerCase(),
      assets,
      activities: activity,
    });

    await Notice.create({
      team,
      text,
      task: task._id,
    });

    res
      .status(200)
      .json({ status: true, task, message: "Task created successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    const newTask = await Task.create({
      ...task,
      title: task.title + " - Duplicate",
    });

    newTask.team = task.team;
    newTask.subTasks = task.subTasks;
    newTask.assets = task.assets;
    newTask.priority = task.priority;
    newTask.stage = task.stage;

    await newTask.save();

    //alert users of the task
    let text = "New task has been assigned to you";
    if (task.team.length > 1) {
      text = text + ` and ${task.team.length - 1} others.`;
    }

    text =
      text +
      ` The task priority is set a ${
        task.priority
      } priority, so check and act accordingly. The task date is ${task.date.toDateString()}. Thank you!!!`;

    await Notice.create({
      team: task.team,
      text,
      task: newTask._id,
    });

    res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { type, activity } = req.body;

    const task = await Task.findById(id);

    const data = {
      type,
      activity,
      by: userId,
    };

    task.activities.push(data);

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// export const dashboardStatistics = async (req, res) => {
//   try {
//     const { userId, isAdmin } = req.user;

//     const allTasks = isAdmin
//       ? await Task.find({
//           isTrashed: false,
//         })
//           .populate({
//             path: "team",
//             select: "name role title email",
//           })
//           .sort({ _id: -1 })
//       : await Task.find({
//           isTrashed: false,
//           team: { $all: [userId] },
//         })
//           .populate({
//             path: "team",
//             select: "name role title email",
//           })
//           .sort({ _id: -1 });

//     const users = await User.find({ isActive: true })
//       .select("name title role isAdmin createdAt")
//       .limit(10)
//       .sort({ _id: -1 });

//     //   group task by stage and calculate counts
//     const groupTaskks = allTasks.reduce((result, task) => {
//       const stage = task.stage;

//       if (!result[stage]) {
//         result[stage] = 1;
//       } else {
//         result[stage] += 1;
//       }

//       return result;
//     }, {});

//     // Group tasks by priority
//     const groupData = Object.entries(
//       allTasks.reduce((result, task) => {
//         const { priority } = task;

//         result[priority] = (result[priority] || 0) + 1;
//         return result;
//       }, {})
//     ).map(([name, total]) => ({ name, total }));

//     // calculate total tasks
//     const totalTasks = allTasks?.length;
//     const last10Task = allTasks?.slice(0, 100);

//     const summary = {
//       totalTasks,
//       last10Task,
//       users: isAdmin ? users : [],
//       tasks: groupTaskks,
//       graphData: groupData,
//     };

//     res.status(200).json({
//       status: true,
//       message: "Successfully",
//       ...summary,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ status: false, message: error.message });
//   }
// };

export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin, isSuperAdmin } = req.user;

    let allTasks;

    if (isSuperAdmin) {
      // SuperAdmins see all tasks
      allTasks = await Task.find({ isTrashed: false })
        .populate({
          path: "team",
          select: "name role title email",
        })
        .sort({ _id: -1 });
    } else if (isAdmin) {
      // Admins see their tasks and tasks of their team members
      // Step 1: Find tasks where the admin is in the team
      const adminTasks = await Task.find({
        isTrashed: false,
        team: { $all: [userId] },
      }).populate({
        path: "team",
        select: "name role title email",
      });

      // Step 2: Extract all team member IDs from admin's tasks
      const teamMemberIds = new Set();
      adminTasks.forEach(task => {
        task.team.forEach(member => teamMemberIds.add(member._id.toString()));
      });

      // Step 3: Find all tasks where any of these team members are involved
      allTasks = await Task.find({
        isTrashed: false,
        team: { $in: [...teamMemberIds] }, // Tasks with any team member
      })
        .populate({
          path: "team",
          select: "name role title email",
        })
        .sort({ _id: -1 });
    } else {
      // Regular users see only their own tasks
      allTasks = await Task.find({
        isTrashed: false,
        team: { $all: [userId] },
      })
        .populate({
          path: "team",
          select: "name role title email",
        })
        .sort({ _id: -1 });
    }

    // Fetch users (only for superAdmins or admins, limit admins to their team later if needed)
    const users = await User.find({ isActive: true })
      .select("name title role isAdmin isSuperAdmin createdAt")
      .limit(10000)
      .sort({ _id: -1 });

    // Group tasks by stage and calculate counts
    const groupedTasks = allTasks.reduce((result, task) => {
      const stage = task.stage;
      result[stage] = (result[stage] || 0) + 1;
      return result;
    }, {});

    // Group tasks by priority
    const priorityData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;
        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // For admins, filter users to only include team members (optional enhancement)
    let filteredUsers = users;
    if (isAdmin && !isSuperAdmin) {
      const teamMemberIds = new Set();
      allTasks.forEach(task => {
        task.team.forEach(member => teamMemberIds.add(member._id.toString()));
      });
      filteredUsers = users.filter(user => teamMemberIds.has(user._id.toString()));
    }

    const summary = {
      totalTasks: allTasks.length,
      last10Task: allTasks.slice(0, 100), // Note: You might want to fix this to 10 if intended
      users: isSuperAdmin ? users : isAdmin ? filteredUsers : [],
      tasks: groupedTasks,
      graphData: priorityData,
    };

    res.status(200).json({
      status: true,
      message: "Successfully retrieved dashboard statistics",
      ...summary,
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);
    return res.status(400).json({
      status: false,
      message: error.message || "Failed to retrieve dashboard statistics",
    });
  }
};


export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    const { userId, isSuperAdmin } = req.user; // Add isSuperAdmin from request

    let query = { isTrashed: isTrashed ? true : false };

    if (stage) {
      query.stage = stage;
    }

    // Only add team filter if user is NOT a super admin
    if (!isSuperAdmin) {
      query.team = { $in: [userId] };
    }

    const tasks = await Task.find(query)
      .populate({
        path: "team",
        select: "name title email",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};


// export const getTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userId } = req.user;

//     // Fetch the task by ID and populate relevant fields
//     const task = await Task.findById(id)
//       .populate({
//         path: "team",
//         select: "name title role email", // Only select relevant fields
//       })
//       .populate({
//         path: "activities.by",
//         select: "name", // Populate activity owners
//       });

//     // Ensure that the user is part of the task's team
//     if (!task.team.some(member => member._id.equals(userId))) {
//       return res.status(403).json({ status: false, message: "Not authorized to view this task" });
//     }

//     res.status(200).json({
//       status: true,
//       task,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ status: false, message: error.message });
//   }
// };

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, isSuperAdmin } = req.user; // Add isSuperAdmin destructuring

    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });

    // Allow Super Admin to bypass team check
    if (!isSuperAdmin) {
      const isTeamMember = task.team.some(member => member._id.equals(userId));
      if (!isTeamMember) {
        return res.status(403).json({ 
          status: false, 
          message: "Not authorized to view this task" 
        });
      }
    }

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date, stage, objectives, startDate, completionDate, teamMember } = req.body; // teamMember is now a single member
    const { id } = req.params;

    // Fetch the main task to retrieve the team
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    // Validate that the team member exists in the task's team
    const teamMemberExists = task.team.some(member => member._id.toString() === teamMember);
    if (!teamMemberExists) {
      return res.status(400).json({ status: false, message: "Invalid team member." });
    }

    const newSubTask = {
      title,
      tag,
      date,
      stage: stage ? stage.toLowerCase() : "todo", // Default stage if undefined
      objectives: objectives || [],
      startDate,
      completionDate,
      team: [teamMember], // Only one team member
    };

    task.subTasks.push(newSubTask); // Push the new subtask to the subtasks array

    await task.save(); // Save changes to the database

    res.status(200).json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};




export const updateSubtask = async (req, res) => {
  console.log("Request body:", req.body); // Log the body
  console.log("Request parameters:", req.params); // Log parameters

  try {
    const { title, tag, date, stage, objectives, newObjective } = req.body; // Add newObjective
    const { id, subTaskId } = req.params;


    // Additional validation if needed
    console.log("ID:", id, "Subtask ID:", subTaskId); // Log IDs

    if (!id || !subTaskId) {
      return res.status(400).json({ status: false, message: "Invalid parameters." });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    const subTask = task.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ status: false, message: "SubTask not found." });
    }

    // Update fields if provided in the request body
    if (title !== undefined) subTask.title = title;
    if (tag !== undefined) subTask.tag = tag;
    if (date !== undefined) subTask.date = date;
    if (stage !== undefined) subTask.stage = stage.toLowerCase();
    if (objectives !== undefined) subTask.objectives = objectives; // Change from subtask to subTask

    if (newObjective && newObjective.trim()) {
      subTask.objectives.push({
        description: newObjective.trim(),
        status: "todo", // Default status
      });
    }

    // Update existing objectives if provided
    if (objectives !== undefined) {
      subTask.objectives = objectives;
    }

    // ... rest of existing code ...
    await task.save();


    res.status(200).json({ status: true, message: "Subtask updated successfully." });
  } catch (error) {
    console.log("Error in updateSubtask:", error); // Log error details
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const addCommentToSubTask = async (req, res) => {
  try {
    const { id, subTaskId } = req.params;
    const { text, rating, reaction, author } = req.body;

    if (!text || !author) {
      return res.status(400).json({ status: false, message: "Text and author are required for comments." });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    const subTask = task.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ status: false, message: "SubTask not found." });
    }

    const newComment = {
      text,
      rating: rating || null,
      reaction: reaction || null,
      author,
      timestamp: new Date(), // Add timestamp here if needed
    };

    subTask.comments.push(newComment);
    await task.save();

    // Return the newly created comment with its _id
    const savedComment = subTask.comments[subTask.comments.length - 1];
    res.status(201).json({ status: true, message: "Comment added successfully.", comment: savedComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};

export const deleteCommentFromSubTask = async (req, res) => {
  try {
    const { id, subTaskId, commentId } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    const subTask = task.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ status: false, message: "SubTask not found." });
    }

    // Filter out the comment with the given commentId
    subTask.comments = subTask.comments.filter(comment => comment._id.toString() !== commentId);
    await task.save();

    res.status(200).json({ status: true, message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ status: false, message: error.message });
  }
};



export const deleteSubTask = async (req, res) => {
  try {
    const { id, subTaskId } = req.params; // Get task and subtask IDs from request parameters

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    // Find the index of the subtask with the given subtaskId
    const subTaskIndex = task.subTasks.findIndex(subtask => subtask._id.toString() === subTaskId);

    if (subTaskIndex === -1) {
      return res.status(404).json({ status: false, message: "SubTask not found." });
    }

    // Remove the subtask from the array
    task.subTasks.splice(subTaskIndex, 1);

    // Save the updated task
    await task.save();

    res.status(200).json({ status: true, message: "SubTask deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};




export const updateSubTaskItem = async (req, res) => {
  try {
    const { id, subTaskId, objectiveId } = req.params;
    const { description, status } = req.body;

    // Validate IDs
    if (!id || !subTaskId || !objectiveId) {
      return res.status(400).json({ status: false, message: "Invalid parameters." });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found." });
    }

    const subTask = task.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ status: false, message: "SubTask not found." });
    }

    // Find and update the specific objective by `objectiveId`
    const objective = subTask.objectives.id(objectiveId);
    if (!objective) {
      return res.status(404).json({ status: false, message: "Objective not found." });
    }

    // Update objective's description if provided
    if (description) {
      objective.description = description;
    }

    // Validate and update status only if it's provided
    if (status) {
      if (typeof status === 'string') {
        objective.status = status.toLowerCase(); // Ensure status is updated
      } else {
        return res.status(400).json({ status: false, message: "Status must be a string." });
      }
    }

    await task.save(); // Save the updated task
    res.status(200).json({ status: true, message: "SubTask and objective updated successfully." });
  } catch (error) {
    // Handle database or unexpected errors
    console.error(error);
    return res.status(500).json({ status: false, message: "An error occurred while updating." });
  }
};




export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id);

    task.title = title;
    task.date = date;
    task.priority = priority.toLowerCase();
    task.assets = assets;
    task.stage = stage.toLowerCase();
    task.team = team;

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    task.isTrashed = true;

    await task.save();

    res.status(200).json({
      status: true,
      message: `Task trashed successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);

      resp.isTrashed = false;
      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    res.status(200).json({
      status: true,
      message: `Operation performed successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
