const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();
const { v4: uuidv4 } = require("uuid");

const validate = function (body) {
  const schema = Joi.object().keys({
    customer_id: Joi.string().required(),
  });
  return new Promise(async (resolve, reject) => {
    try {
      const value = await schema.validateAsync(body);
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
    const { employee_id } = await utils.verifyEmployee(
      event.headers.Authorization
    );

    let apiData = JSON.parse(event.body);
    await validate(apiData);
    let { customer_id } = apiData;

    let link_token = uuidv4();

    await DB.dataInsert("link_token_master", {
      link_token,
      _customer_id: customer_id,
      _employee_id: employee_id,
    });

    response = {
      status: true,
      message: "Link token generated successfully",
      data: {
        link_token,
      },
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
