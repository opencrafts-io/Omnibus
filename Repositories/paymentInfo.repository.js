import {PaymentInfo} from "../Models/index.js";


export const createPaymentInfoRepository = async (data , options={}) => {
  try {
    const paymentInfo = await PaymentInfo.create(data , options);
    // remove event_id from response
    const { event_id, ...response } = paymentInfo.toJSON();

    return response;
  } catch (err) {
    throw err;
  }
};

export const getPaymentInfoRepository = async (id) => {
  try {
    const paymentInfo = await PaymentInfo.findByPk(id);
    return paymentInfo;
  } catch (err) {
    throw err;
  }
};

export const updatePaymentInfoRepository = async (id, data) => {
  try {
    const paymentInfo = await PaymentInfo.findByPk(id);
    if (!paymentInfo) {
      throw new Error("Payment info not found");
    }
    await paymentInfo.update(data);
    return paymentInfo;
  } catch (err) {
    throw err;
  }
};

export const deletePaymentInfoRepository = async (id) => {
  try {
    const paymentInfo = await PaymentInfo.findByPk(id);
    if (!paymentInfo) {
      throw new Error("Payment info not found");
    }
    await paymentInfo.destroy();
    return { message: "Payment info deleted successfully" };
  } catch (err) {
    throw err;
  }
};

export const getPaymentInfoByEventIdRepository = async (eventId) => {
  try {
    const paymentInfo = await PaymentInfo.findOne({ where: { event_id: eventId } });
    return paymentInfo;
  } catch (err) {
    throw err;
  }
};