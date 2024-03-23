const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const { DBManager } = require("../../common/dbmanager");
const DBObj = new DBManager();
const Joi = require("joi");

const validateAction = function (body) {
  console.log("========test======");
  const ListAction = ["add_itr", "edit_itr", "delete_itr", "get_itr_list"];
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

const validateAddItr = function (body) {
  const schema = Joi.object().keys({
    customer_id: Joi.string().required(),
    year: Joi.string().required(),
    itr_url: Joi.array().items(Joi.string()).required(),
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

const validateEditItr = function (body) {
  const schema = Joi.object().keys({
    itr_id: Joi.number().required(),
    year: Joi.string().optional(),
    itr_url: Joi.array().items(Joi.string()).optional(),
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

const validateDeleteItr = function (body) {
  const schema = Joi.object().keys({
    itr_id: Joi.number().required(),
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

const validateGetItr = function (body) {
  const schema = Joi.object().keys({
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
    await utils.verifyEmployee(event.headers.Authorization);
    let apiData = JSON.parse(event.body);
    await validateAction(apiData);
    const { action } = apiData;

    switch (action) {
      case "add_itr":
        await validateAddItr(apiData);
        return await addItr(apiData);

      case "edit_itr":
        await validateEditItr(apiData);
        return await editItr(apiData);

      case "delete_itr":
        await validateDeleteItr(apiData);
        return await deleteItr(apiData);

      case "get_itr_list":
        await validateGetItr(apiData);
        return await getItr(apiData);

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

const addItr = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { customer_id, year, itr_url } = apiData;

    let insertObj = {
      _customer_id: customer_id,
      year,
      itr_url: JSON.stringify(itr_url),
    };

    await DBObj.dataInsert("itr_master", insertObj);

    response = {
      status: true,
      message: `ITR added successfully.`,
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

const editItr = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { itr_id, year, itr_url } = apiData;

    const itrResult = await DBObj.runQuery(
      `SELECT * FROM itr_master WHERE itr_id = ${itr_id} AND is_deleted = 0`
    );

    const itrData = itrResult.rows.length > 0 ? itrResult.rows[0] : null;

    if (!itrData) {
      throw new Error("ITR not found!");
    }

    let updateObj = {
      year,
      itr_url: JSON.stringify(itr_url),
    };

    await DBObj.dataUpdate("itr_master", updateObj, { itr_id });

    response = {
      status: true,
      message: `ITR edited successfully.`,
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

const deleteItr = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { itr_id } = apiData;

    const itrResult = await DBObj.runQuery(
      `SELECT * FROM itr_master WHERE itr_id = ${itr_id} AND is_deleted = 0`
    );

    const itrData = itrResult.rows.length > 0 ? itrResult.rows[0] : null;

    if (!itrData) {
      throw new Error("ITR not found!");
    }

    await DBObj.dataUpdate("itr_master", { is_deleted: 1 }, { itr_id });

    response = {
      status: true,
      message: `ITR deleted successfully.`,
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

const getItr = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { customer_id } = apiData;

    const itrResult = await DBObj.runQuery(`SELECT 
    IM.itr_id,
    IM.year,
    IM.itr_url,
    IM.date_created
    FROM itr_master IM WHERE IM._customer_id = '${customer_id}' AND IM.is_deleted = 0`);

    response = {
      status: true,
      message: `ITR list fetched successfully.`,
      data: itrResult.rows,
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
