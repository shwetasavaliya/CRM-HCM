const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const { DBManager } = require("../../common/dbmanager");
const DBObj = new DBManager();
const Joi = require("joi");

const validateAction = function (body) {
  const ListAction = [
    "add_category",
    "edit_category",
    "delete_category",
    "get_category_list",
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

const validateAddCategory = function (body) {
  const schema = Joi.object().keys({
    category_name: Joi.string().required(),
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

const validateEditCategory = function (body) {
  const schema = Joi.object().keys({
    category_id: Joi.number().required(),
    category_name: Joi.string().optional(),
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

const validateDeleteCategory = function (body) {
  const schema = Joi.object().keys({
    category_id: Joi.number().required(),
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
      case "add_category":
        await validateAddCategory(apiData);
        return await addCategory(apiData, company_id);
      case "edit_category":
        await validateEditCategory(apiData);
        return await editCategory(apiData);

      case "delete_category":
        await validateDeleteCategory(apiData);
        return await deleteCategory(apiData);

      case "get_category_list":
        return await getCategoryList(company_id);

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

const addCategory = async function (apiData, company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { category_name } = apiData;

    const categoryResult = await DBObj.runQuery(
      `SELECT * FROM category_master WHERE category_name = '${category_name}' AND  is_deleted = 0 AND _company_id = '${company_id}'`
    );

    const categoryData =
      categoryResult.rows.length > 0 ? categoryResult.rows[0] : null;

    if (categoryData) {
      throw new Error("Category already exists!");
    }

    const insertObj = {
      category_name,
      _company_id: company_id,
    };

    await DBObj.dataInsert("category_master", insertObj);

    response = {
      status: true,
      message: `Category added successfully.`,
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

const editCategory = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { category_name, category_id } = apiData;

    const categoryResult = await DBObj.runQuery(
      `SELECT * FROM category_master WHERE category_id = ${category_id} AND  is_deleted = 0`
    );

    const categoryData =
      categoryResult.rows.length > 0 ? categoryResult.rows[0] : null;

    if (!categoryData) {
      throw new Error("Category not found!");
    }

    const updateObj = {
      category_name,
    };

    await DBObj.dataUpdate("category_master", updateObj, { category_id });

    response = {
      status: true,
      message: `Category edited successfully.`,
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

const deleteCategory = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { category_id } = apiData;

    const categoryResult = await DBObj.runQuery(
      `SELECT * FROM category_master WHERE category_id = ${category_id} AND  is_deleted = 0`
    );

    const categoryData =
      categoryResult.rows.length > 0 ? categoryResult.rows[0] : null;

    if (!categoryData) {
      throw new Error("Category not found!");
    }

    await DBObj.dataUpdate(
      "category_master",
      { is_deleted: 1 },
      { category_id }
    );

    response = {
      status: true,
      message: `Category deleted successfully.`,
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

const getCategoryList = async function (company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    const categoryResult = await DBObj.runQuery(`SELECT 
        CM.category_id,
        CM.category_name
        FROM category_master CM
        WHERE CM.is_deleted = 0 AND CM._company_id = '${company_id}'`);

    const categoryData =
      categoryResult.rows.length > 0 ? categoryResult.rows : [];

    response = {
      status: true,
      message: `Category fetched successfully.`,
      data: { categoryData },
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
