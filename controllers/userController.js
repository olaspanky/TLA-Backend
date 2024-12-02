import { response } from "express";
import User from "../models/user.js";
import { createJWT } from "../utils/index.js";
import Notice from "../models/notification.js";


export const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, isSuperAdmin, role, title, dept, securityQuestion, securityAnswer } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      isSuperAdmin,
      role,
      title,
      dept,
      securityQuestion,
      securityAnswer,
    });

    if (user) {
      if (isAdmin || isSuperAdmin) createJWT(res, user._id);
      user.password = undefined;
      user.securityAnswer = undefined;
      res.status(201).json(user);
    } else {
      res.status(400).json({ status: false, message: "Invalid user data" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: false, message: error.message });
  }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password." });
    }

    if (!user?.isActive) {
      return res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (user && isMatch) {
      createJWT(res, user._id);

      user.password = undefined;

      res.status(200).json(user);
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      htttpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getTeamList = async (req, res) => {
  try {
    const users = await User.find().select("name title role email isActive");

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getNotificationsList = async (req, res) => {
  try {
    const { userId } = req.user;

    const notice = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title");

    res.status(201).json(notice);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const { _id } = req.body;

    const id =
      isAdmin && userId === _id
        ? userId
        : isAdmin && userId !== _id
        ? _id
        : userId;

    const user = await User.findById(id);

    if (user) {
      user.name = req.body.name || user.name;
      user.title = req.body.title || user.title;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();

      user.password = undefined;

      res.status(201).json({
        status: true,
        message: "Profile Updated Successfully.",
        user: updatedUser,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { userId } = req.user;

    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    } else {
      await Notice.findOneAndUpdate(
        { _id: id, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    }

    res.status(201).json({ status: true, message: "Done" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (user) {
      user.password = req.body.password;

      await user.save();

      user.password = undefined;

      res.status(201).json({
        status: true,
        message: `Password chnaged successfully.`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const activateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (user) {
      user.isActive = req.body.isActive; //!user.isActive

      await user.save();

      res.status(201).json({
        status: true,
        message: `User account has been ${
          user?.isActive ? "activated" : "disabled"
        }`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};


// export const forgotPassword = async (req, res) => {
//   try {
//     const { email, securityAnswer, newPassword } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     // Validate security answer
//     const isAnswerMatch = await user.matchSecurityAnswer(securityAnswer);
//     if (!isAnswerMatch) {
//       return res.status(401).json({ status: false, message: "Incorrect security answer" });
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();
//     user.password = undefined;

//     res.status(200).json({ status: true, message: "Password updated successfully" });
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({ status: false, message: error.message });
//   }
// };
export const forgotPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ status: false, message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found." });
    }

    // Step 1: Return security question if no answer or new password is provided
    if (!securityAnswer && !newPassword) {
      if (!user.securityQuestion) {
        return res.status(400).json({ status: false, message: "No security question set for this user." });
      }
      return res.status(200).json({
        status: true,
        securityQuestion: user.securityQuestion, // Assuming `securityQuestion` is a field in your schema
      });
    }

    // Step 2: Validate Security Answer
    if (securityAnswer && !newPassword) {
      const isAnswerMatch = await user.matchSecurityAnswer(securityAnswer);
      if (!isAnswerMatch) {
        return res.status(401).json({ status: false, message: "Incorrect security answer." });
      }
      return res.status(200).json({ status: true, validAnswer: true });
    }

    // Step 3: Update Password
    if (newPassword) {
      user.password = newPassword; // Password will be hashed via pre-save hook
      await user.save();
      return res.status(200).json({ status: true, message: "Password updated successfully." });
    }

    res.status(400).json({ status: false, message: "Invalid request." });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ status: false, message: "Internal server error." });
  }
};
