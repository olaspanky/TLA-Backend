
import express from "express";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateTask,
  updateSubtask,
  updateSubTaskItem, deleteSubTask, addCommentToSubTask
} from "../controllers/taskController.js";
import { isAdminRoute, protectRoute } from "../middlewares/authMiddlewave.js";

const router = express.Router();

router.post("/create", protectRoute, isAdminRoute, createTask);
router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectRoute, postTaskActivity);
router.post('/:id/subtasks/:subTaskId/comments', addCommentToSubTask);



router.get("/dashboard", protectRoute, dashboardStatistics);
router.get("/", protectRoute, getTasks);
router.get("/:id", protectRoute, getTask);

router.put("/create-subtask/:id", protectRoute, createSubTask);
router.put("/update-subtaskItem/:id/:subTaskId/:objectiveId", protectRoute, updateSubTaskItem); 
router.put("/update-subtask/:id/:subTaskId", protectRoute, updateSubtask); 

router.put("/update/:id", protectRoute, updateTask);
router.put("/:id", protectRoute, trashTask);
router.delete("/delete-subtask/:id/:subTaskId", protectRoute, deleteSubTask); // New route for deleting a subtask


router.delete(
  "/delete-restore/:id?",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);

export default router;
