const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();
var bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const saltRounds = 10;

const validate = function (body) {
  const schema = Joi.object().keys({
    company_id: Joi.string().optional(),
    company_name: Joi.string().optional(),
    first_name: Joi.string().required(),
    middle_name: Joi.string().required(),
    last_name: Joi.string().required(),
    mobile_number: Joi.string().required(),
    email_id: Joi.string().email().required(),
    gender: Joi.string().required(),
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
    let apiData = JSON.parse(event.body);
    await validate(apiData);
    let {
      company_id,
      company_name,
      first_name,
      middle_name,
      last_name,
      mobile_number,
      email_id,
      gender,
    } = apiData;

    email_id = email_id.toLowerCase();

    let companyData = {};

    let employeeData = await DB.getData("employee_master", "*", {
      email_id,
    });

    if (employeeData.rows.length > 0) {
      response.message = "Email id already exists!";
      return awsRequestHelper.respondWithJsonBody(200, response);
    }

    if (!!company_id) {
      const companyResult = await DB.getData("employee_master", "*", {
        company_id,
      });

      companyData = companyResult.rows.length > 0 ? companyResult.rows[0] : {};
    }

    let company_uuid = !!company_id ? company_id : uuidv4();
    let password = "123456";
    const salt = bcrypt.genSaltSync(saltRounds);
    const newPassword = bcrypt.hashSync(password, salt);

    let insertObj = {
      employee_id: uuidv4(),
      company_id: company_uuid,
      company_name: company_name || companyData.company_name || "",
      first_name,
      middle_name,
      last_name,
      mobile_number,
      email_id,
      user_name: email_id,
      password: newPassword,
      gender,
      role: company_id ? "EMP" : "ADMIN",
    };

    await DB.dataInsert("employee_master", insertObj);

    response.status = true;
    response.message = "Registered successfully";

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
