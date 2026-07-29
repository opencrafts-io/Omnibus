import { Transaction } from "../Models/index.js";

export const createTransactionRepository = async (data , options = {}) => {
  try {
    const transaction = await Transaction.create(data , options);
    return transaction;
  } catch (error) {
    throw error;
  }
};

export const getAllTransactionsRepository = async () => {
  try {
    const transactions = await Transaction.findAll();
    return transactions;
  } catch (error) {
    throw error;
  }
};

export const getTransactionByUserIdTicketIdRepository = async (userId , ticketId) => {
  try {
    const transactions = await Transaction.findOne({ where: { user_id: userId , ticket_id: ticketId } });
    return transactions;
  } catch (error) {
    throw error;
  }
};

export const getTransactionByIdRepository = async (id) => {
  try {
    const transaction = await Transaction.findByPk(id);
    return transaction;
  } catch (error) {
    throw error;
  }
};

export const updateTransactionRepository = async (id, data , options = {}) => {
  try {
    const transaction = await Transaction.findByPk(id , options);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    await transaction.update(data , options);
    return transaction;
  } catch (error) {
    throw error;
  }
};

// repositories/transactionRepository.js (Add these functions)
export const getTransactionByBookingIdRepository = async (bookingId) => {
  try {
    const transaction = await Transaction.findOne({ 
      where: { booking_id: bookingId } 
    });
    return transaction;
  } catch (error) {
    throw error;
  }
};

export const getTransactionByBookingReferenceRepository = async (bookingReference) => {
  try {
    const transaction = await Transaction.findOne({ 
      where: { booking_reference: bookingReference } 
    });
    return transaction;
  } catch (error) {
    throw error;
  }
};

export const getTransactionsByUserRepository = async (userId, limitPlusOne, offset) => {
  try {
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: limitPlusOne,
      offset
    });
    return transactions;
  } catch (error) {
    throw error;
  }
};