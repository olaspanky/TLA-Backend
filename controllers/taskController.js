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

export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    const allTasks = isAdmin
      ? await Task.find({
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 })
      : await Task.find({
          isTrashed: false,
          team: { $all: [userId] },
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt")
      .limit(10)
      .sort({ _id: -1 });

    //   group task by stage and calculate counts
    const groupTaskks = allTasks.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    // Group tasks by priority
    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;

        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTaskks,
      graphData: groupData,
    };

    res.status(200).json({
      status: true,
      message: "Successfully",
      ...summary,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// export const getTasks = async (req, res) => {
//   try {
//     const { stage, isTrashed } = req.query;

//     let query = { isTrashed: isTrashed ? true : false };

//     if (stage) {
//       query.stage = stage;
//     }

//     let queryResult = Task.find(query)
//       .populate({
//         path: "team",
//         select: "name title email",
//       })
//       .sort({ _id: -1 });

//     const tasks = await queryResult;

//     res.status(200).json({
//       status: true,
//       tasks,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ status: false, message: error.message });
//   }
// };

// export const getTask = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const task = await Task.findById(id)
//       .populate({
//         path: "team",
//         select: "name title role email",
//       })
//       .populate({
//         path: "activities.by",
//         select: "name",
//       });

//     res.status(200).json({
//       status: true,
//       task,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ status: false, message: error.message });
//   }
// };

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    const { userId } = req.user; // Get the logged-in user's ID

    // Build query based on stage and trashed filters
    let query = { isTrashed: isTrashed ? true : false };

    // Add stage filtering if provided
    if (stage) {
      query.stage = stage;
    }

    // Only return tasks where the user is part of the team
    query.team = { $in: [userId] }; // Match tasks where userId is in the team array

    // Execute the query
    const tasks = await Task.find(query)
      .populate({
        path: "team",
        select: "name title email", // Only select relevant fields
      })
      .sort({ _id: -1 }); // Sort by task ID in descending order

    res.status(200).json({
      status: true,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    // Fetch the task by ID and populate relevant fields
    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email", // Only select relevant fields
      })
      .populate({
        path: "activities.by",
        select: "name", // Populate activity owners
      });

    // Ensure that the user is part of the task's team
    if (!task.team.some(member => member._id.equals(userId))) {
      return res.status(403).json({ status: false, message: "Not authorized to view this task" });
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
    const { title, tag, date, stage, objectives } = req.body; // Make sure objectives are passed in the request body

    const { id } = req.params;

    const newSubTask = {
      title,
      date,
      tag,
      stage: stage.toLowerCase(),
      objectives: objectives || [] // Initialize objectives as an empty array if not provided
    };

    const task = await Task.findById(id);

    task.subTasks.push(newSubTask);

    await task.save();

    res.status(200).json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};



export const updateSubTask = async (req, res) => {
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
