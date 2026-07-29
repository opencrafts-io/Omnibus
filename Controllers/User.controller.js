import {
  createUserRepository,
  getUserByIdRepository,
  updateUserRepository,
  getUserByUsernameRepository
} from '../Repositories/User.repository.js';

import { logs } from '../Utils/logs.js';


export const createUserController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user = await createUserRepository(req.body);

    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "INFO",
      req.ip,
      req.method,
      "User created successfully",
      req.originalUrl,
      201,
      req.headers["user-agent"]
    );

    res.status(201).json(user);
  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "ERROR",
      req.ip,
      req.method,
      error.message,
      req.originalUrl,
      500,
      req.headers["user-agent"]
    );

    res.status(500).json({ message: error.message });
  }
};


export const getUserByIdController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user = await getUserByIdRepository(req.user?.sub);

    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "INFO",
      req.ip,
      req.method,
      "User fetched successfully",
      req.originalUrl,
      200,
      req.headers["user-agent"]
    );

    res.status(200).json(user);
  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "ERROR",
      req.ip,
      req.method,
      error.message,
      req.originalUrl,
      500,
      req.headers["user-agent"]
    );

    res.status(500).json({ message: error.message });
  }
};


export const updateUserController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const organizer_id = req.user.sub;
    const user = await updateUserRepository(organizer_id, req.body);

    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "INFO",
      req.ip,
      req.method,
      "User updated successfully",
      req.originalUrl,
      200,
      req.headers["user-agent"]
    );

    res.status(200).json(user);
  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "ERROR",
      req.ip,
      req.method,
      error.message,
      req.originalUrl,
      500,
      req.headers["user-agent"]
    );

    res.status(500).json({ message: error.message });
  }
};




export const getUserByUsernameController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
        const { q } = req.query;
    const searchQuery = q?.trim() || "";

       if (!searchQuery) {
      const duration = Number(process.hrtime.bigint() - start);

      logs(
        duration,
        "WARN",
        req.ip,
        req.method,
        "Missing search query",
        req.originalUrl,
        400,
        req.headers["user-agent"]
      );

      return res
        .status(400)
        .json({ error: "Missing search query parameter (?q=...)" });
    }

    const results = await getUserByUsernameRepository(searchQuery);

    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "INFO",
      req.ip,
      req.method,
      "Search performed",
      req.originalUrl,
      200,
      req.headers["user-agent"]
    );
    
    if (!results || results.length === 0) {
      return res.status(200).json(
        {
      count: results.length,
      data: results,
    }
      );
    }


        return res.status(200).json({
      count: results.length,
      data: results,
    });
  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "ERROR",
      req.ip,
      req.method,
      error.message,
      req.originalUrl,
      500,
      req.headers["user-agent"]
    );

    res.status(500).json({ message: error.message });
  }
};
