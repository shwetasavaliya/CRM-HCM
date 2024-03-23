const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();

const validate = function (body) {
  const schema = Joi.object().keys({
    employee_id: Joi.string().required(),
    customer_id: Joi.string().required(),
    sender_id: Joi.string().required(),
    receiver_id: Joi.string().required(),
    message: Joi.string().required(),
  });
  return new Promise(async (resolve, reject) => {
    try {
      const value = await schema.validateAsync(body, { allowUnknown: true });
      resolve(value);
    } catch (error) {
      reject({ status_code: 400, message: error.details[0].message });
    }
  });
};

export const handler = async function (event, context, callback) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let apiData = JSON.parse(event.body);
    await validate(apiData);
    let { employee_id, customer_id, sender_id, receiver_id, message } = apiData;

    let conversationResult = await DB.runQuery(
      `SELECT * FROM conversations_master WHERE _customer_id = '${customer_id}' AND _employee_id = '${employee_id}' AND is_deleted = 0`
    );

    if (conversationResult.rows.length === 0) {
      let insertObj = {
        _customer_id: customer_id,
        _employee_id: employee_id,
      };

      conversationResult = await DB.dataInsert(
        "conversations_master",
        insertObj,
        "conversation_id"
      );
    }

    let conversationData =
      conversationResult.rows.length > 0 ? conversationResult.rows[0] : null;

    let messageObj = {
      _conversation_id: conversationData.conversation_id,
      _sender_id: sender_id,
      _receiver_id: receiver_id,
      message: message,
    };

    await DB.dataInsert("messages_master", messageObj);

    response = {
      status: true,
      message: `Message sent successfully!`,
    };
    return awsRequestHelper.respondWithJsonBody(200, response);
  } catch (error) {
    console.error("error : ", error);
    response.message =
      error && error.message ? error.message : response.message;
    let status_code =
      error && Number.isInteger(error.status_code)
        ? Number(error.status_code)
        : 500;
    return awsRequestHelper.respondWithJsonBody(status_code, response);
  }
};
