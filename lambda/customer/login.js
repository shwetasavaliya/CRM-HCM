const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();
var bcrypt = require("bcryptjs");

const validate = function (body) {
  const schema = Joi.object().keys({
    user_name: Joi.string().email().allow("").optional(),
    password: Joi.string().min(6).max(50).allow("").optional(),
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
    let { password, user_name } = apiData;

    const customerResult = await DB.getData("customer_master", "*", {
      user_name,
    });

    if (customerResult.rows.length === 0) {
      response.message = "Invalid Email Id or Password";
      return awsRequestHelper.respondWithJsonBody(200, response);
    }

    const customerData =
      customerResult.rows.length > 0 ? customerResult.rows[0] : {};

    if (
      customerData.password &&
      !bcrypt.compareSync(password, customerData.password)
    ) {
      response.message = "Invalid Email Id or Password";
      return awsRequestHelper.respondWithJsonBody(200, response);
    }

    if (!customerData.is_first_login) {
      await DB.dataUpdate(
        "customer_master",
        { is_first_login: true },
        { customer_uuid: customerData.customer_uuid }
      );
    }

    var payload = {
      id: customerData.customer_uuid,
    };

    var token = utils.createCustomerJWT(payload, "30d");
    response.status = true;
    response.message = "Login successfully!";
    response.data = {
      token: token,
      customer: {
        id: customerData.customer_uuid,
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
