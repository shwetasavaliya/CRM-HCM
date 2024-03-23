const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();

const validate = function (body) {
  const schema = Joi.object().keys({
    employee_id: Joi.string().required(),
    customer_id: Joi.string().required(),
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
    let { employee_id, customer_id } = apiData;

    const messageResult = await DB.runQuery(`SELECT 
    CM.customer_id,
    CM.first_name,
    CM.middle_name,
    CM.last_name,
    CM.user_image_url,
    CSM.conversation_id,
    MM.message_id,
    MM.message,
    MM.date_created
    FROM conversations_master CSM
    LEFT JOIN customer_master CM ON CM.customer_uuid = CSM._customer_id AND CM.is_deleted = 0
    LEFT JOIN messages_master MM ON MM._conversation_id = CSM.conversation_id  AND MM.is_deleted = 0
    WHERE CSM._employee_id = '${employee_id}'AND CSM._customer_id = '${customer_id}' AND CM.is_deleted = 0
    ORDER BY MM.date_created DESC`);

    const messageData =
      messageResult?.rows?.length > 0 ? messageResult.rows : [];

    response = {
      status: true,
      message: `Message fetched successfully`,
      data: { messageData },
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
