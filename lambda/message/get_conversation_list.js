const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();

const validate = function (body) {
  const schema = Joi.object().keys({
    employee_id: Joi.string().required(),
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
    let { employee_id } = apiData;

    const messageResult = await DB.runQuery(`SELECT 
        CSM.conversation_id,
        CSM._employee_id,
        CSM._customer_id,
        CM.first_name as customer_first_name,
        CM.middle_name as customer_middle_name,
        CM.last_name as customer_last_name,
        CM.user_image_url as customer_image_url,
        EM.first_name as employee_first_name,
        EM.middle_name as employee_middle_name,
        EM.last_name as employee_last_name,
        CSM.date_created
        FROM conversations_master CSM
        LEFT JOIN customer_master CM ON CM.customer_uuid = CSM._customer_id AND CM.is_deleted = 0
        LEFT JOIN employee_master EM ON EM.employee_id = CSM._employee_id AND EM.is_deleted = 0
        WHERE CSM.is_deleted = 0 AND CSM._employee_id = '${employee_id}'
        ORDER BY CSM.date_created DESC`);

    const messageData =
      messageResult?.rows?.length > 0 ? messageResult.rows : [];

    response = {
      status: true,
      message: `Conversation fetched successfully`,
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
