import {User} from "../Models/index.js";
import { Op } from "sequelize";

export const createUserRepository = async (data) => {
  try {
    const user = await User.create(data);
    return user;
  } catch (error) {
    throw error;
  }
}

export const getUserByIdRepository = async (id) => {
  try {
    const user = await User.findByPk(id);
    return user;
  } catch (error) {
    throw error;
  }
}


export const updateUserRepository = async (id, data) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update(data);
    
    return user;
  } catch (error) {
    throw error;
  }
}

export const getUserByUsernameRepository = async (searchQuery) =>
  {
      try {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.iLike]: `%${searchQuery}%` } },
          // { email: { [Op.iLike]: `%${searchQuery}%` } },
          // { event_location: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      order: [["created_at", "DESC"]],
    });

    return users;
  } catch (error) {
    throw error;
  }
  }