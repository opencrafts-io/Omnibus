import express from "express";
import {
  createUserController,
  getUserByIdController,
  updateUserController,
  getUserByUsernameController
} from "../Controllers/User.controller.js";

const router = express.Router();
import {verifyToken} from "../Middleware/jwt_token_verification.js";

router.use(verifyToken);

router.post("/", createUserController);
router.get("/", getUserByIdController);
router.put("/", updateUserController);
router.get("/search", getUserByUsernameController);

export default router;