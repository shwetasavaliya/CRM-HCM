const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const { DBManager } = require("../../common/dbmanager");
const DBObj = new DBManager();
const Joi = require("joi");

const validateAction = function (body) {
  const ListAction = [
    "get_employee_details",
    "get_employee_list",
    "edit_employee",
    "delete_employee",
  ];
  const schema = Joi.object().keys({
    action: Joi.string()
      .valid(...ListAction)
      .required(),
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

const validateEditEmployee = function (body) {
  const schema = Joi.object().keys({
    employee_id: Joi.string().required(),
    first_name: Joi.string().optional(),
    middle_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    mobile_number: Joi.string().optional(),
    gender: Joi.string().optional(),
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

const validateGetEmployee = function (body) {
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

const validateDeleteEmployee = function (body) {
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
    const { company_id } = await utils.verifyEmployee(
      event.headers.Authorization
    );
    let apiData = JSON.parse(event.body);
    await validateAction(apiData);
    const { action } = apiData;

    switch (action) {
      case "edit_employee":
        await validateEditEmployee(apiData);
        return await editEmployee(apiData);

      case "get_employee_details":
        await validateGetEmployee(apiData);
        return await getEmployeeDetails(apiData);

      case "get_employee_list":
        return await getEmployeeList(company_id);

      case "delete_employee":
        await validateDeleteEmployee(apiData);
        return await deleteEmployee(apiData);

      default:
        break;
    }
  } catch (error) {
    console.error("error : ", error);
    response.message =
      error && error.message ? error.message : response.message;
    if (error?.error_code) {
      response.error_code = error?.error_code;
    }
    let status_code =
      error && Number.isInteger(error.status_code)
        ? Number(error.status_code)
        : 500;
    return awsRequestHelper.respondWithJsonBody(status_code, response);
  }
};

const editEmployee = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let {
      employee_id,
      first_name,
      middle_name,
      last_name,
      mobile_number,
      gender,
    } = apiData;

    const employeeResult = await DBObj.runQuery(
      `SELECT * FROM employee_master WHERE employee_id = '${employee_id}' AND is_deleted = 0 `
    );

    const employeeData =
      employeeResult.rows.length > 0 ? employeeResult.rows[0] : null;

    if (!employeeData) {
      throw new Error("Employee not found!");
    }

    let updateObj = {
      first_name,
      middle_name,
      last_name,
      mobile_number,
      gender,
    };

    await DBObj.dataUpdate("employee_master", updateObj, {
      employee_id,
    });

    response = {
      status: true,
      message: `Employee edited successfully.`,
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

const getEmployeeDetails = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { employee_id } = apiData;

    const employeeResult = await DBObj.runQuery(`SELECT 
    EM.employee_id,
    EM.company_id,
    EM.company_name,
    EM.first_name,
    EM.middle_name,
    EM.last_name,
    EM.mobile_number,
    EM.user_name,
    EM.email_id,
    EM.password,
    EM.gender,
    EM.role,
    EM.date_created,
    EM.is_first_login,
    EM.is_active
    FROM employee_master EM
    WHERE EM.employee_id = '${employee_id}' AND EM.is_deleted = 0`);

    const employeeData =
      employeeResult.rows.length > 0 ? employeeResult.rows[0] : {};

    response = {
      status: true,
      message: `Employee fetched successfully.`,
      data: { employeeData },
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

const getEmployeeList = async function (company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    const employeeResult = await DBObj.runQuery(`SELECT 
      EM.employee_id,
      EM.company_id,
      EM.company_name,
      EM.first_name,
      EM.middle_name,
      EM.last_name,
      EM.mobile_number,
      EM.user_name,
      EM.email_id,
      EM.password,
      EM.gender,
      EM.role,
      EM.date_created,
      EM.is_first_login,
      EM.is_active
      FROM employee_master EM
      WHERE EM.company_id = '${company_id}' AND EM.is_deleted = 0`);

    const employeeData =
      employeeResult.rows.length > 0 ? employeeResult.rows : [];

    response = {
      status: true,
      message: `Employee fetched successfully.`,
      data: { employeeData },
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

const deleteEmployee = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { employee_id } = apiData;

    const employeeResult = await DBObj.runQuery(
      `SELECT * FROM employee_master WHERE employee_id = '${employee_id}' AND is_deleted = 0`
    );

    const employeeData =
      employeeResult.rows.length > 0 ? employeeResult.rows[0] : null;

    if (!employeeData) {
      throw new Error("Employee not found!");
    }

    await DBObj.dataUpdate(
      "employee_master",
      { is_deleted: 1 },
      { employee_id }
    );

    response = {
      status: true,
      message: `Employee deleted successfully.`,
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
