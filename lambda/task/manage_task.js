const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();
const { v4: uuidv4 } = require("uuid");
import moment from "moment";
import utils from "../../common/utils";
const dateFormat = "YYYY-MM-DD HH:mm:ss";

const validateAction = function (body) {
  const ListAction = ["add_task", "edit_task", "get_task", "delete_task"];
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

const validateAddTask = function (body) {
  const schema = Joi.object().keys({
    created_by: Joi.string().required(),
    assigned_to: Joi.string().required(),
    completion_date: Joi.string().required(),
    status: Joi.string().required(),
    description: Joi.string().required(),
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

const validateEditTask = function (body) {
  const schema = Joi.object().keys({
    task_id: Joi.string().required(),
    created_by: Joi.string().optional(),
    assigned_to: Joi.string().optional(),
    completion_date: Joi.string().optional(),
    status: Joi.string().optional(),
    description: Joi.string().optional(),
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

const validateDeleteTask = function (body) {
  const schema = Joi.object().keys({
    task_id: Joi.string().required(),
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
    let { company_id } = await utils.verifyEmployee(
      event.headers.Authorization
    );

    let apiData = JSON.parse(event.body);
    await validateAction(apiData);
    const { action } = apiData;

    switch (action) {
      case "add_task":
        await validateAddTask(apiData);
        return await addTask(apiData, company_id);

      case "edit_task":
        await validateEditTask(apiData);
        return await editTask(apiData);

      case "delete_task":
        await validateDeleteTask(apiData);
        return await deleteTask(apiData);

      case "get_task":
        return await getTask(company_id);

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

const addTask = async function (apiData, company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { created_by, assigned_to, completion_date, status, description } =
      apiData;

    let taskObj = {
      task_id: uuidv4(),
      _created_by: created_by,
      _assigned_to: assigned_to,
      completion_date,
      transaction_date: moment.utc().format(dateFormat),
      status,
      description,
      _company_id: company_id,
    };

    await DB.dataInsert("task_master", taskObj);

    response = {
      status: true,
      message: `Task created successfully`,
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

const editTask = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let {
      task_id,
      created_by,
      assigned_to,
      completion_date,
      status,
      description,
    } = apiData;

    const taskResult = await DB.runQuery(
      `SELECT * FROM task_master WHERE task_id = '${task_id}' AND is_deleted = 0`
    );

    const taskData = taskResult.rows.length > 0 ? taskResult.rows[0] : null;

    if (!taskData) {
      throw new Error("Task not found.");
    }

    let updateObj = {};

    if (created_by) updateObj._created_by = created_by;
    if (assigned_to) updateObj._assigned_to = assigned_to;
    if (completion_date) updateObj.completion_date = completion_date;
    if (status) {
      updateObj.status = status;
      updateObj.transaction_date = moment.utc().format(dateFormat);
    }
    if (description) updateObj.description = description;

    if (Object.keys(updateObj).length > 0) {
      await DB.dataUpdate("task_master", updateObj, {
        task_id,
      });
    }

    response = {
      status: true,
      message: `Task updated successfully`,
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

const deleteTask = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { task_id } = apiData;

    const taskResult = await DB.runQuery(
      `SELECT * FROM task_master WHERE task_id = '${task_id}' AND is_deleted = 0`
    );

    const taskData = taskResult.rows.length > 0 ? taskResult.rows[0] : null;

    if (!taskData) {
      throw new Error("Task not found.");
    }

    await DB.dataUpdate(
      "task_master",
      {
        is_deleted: 1,
      },
      {
        task_id,
      }
    );

    response = {
      status: true,
      message: `Task deleted successfully`,
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

const getTask = async function (company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    const taskResult = await DB.runQuery(`SELECT 
    TM.task_id,
    TM._created_by,
    TM._assigned_to,
    TM.completion_date,
    TM.status,
    TM.description,
    TM.transaction_date,
    TM._company_id,
    CASE WHEN COUNT(EM.employee_id) > 0 THEN JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('first_name',EM.first_name,'middle_name',EM.middle_name,'last_name',EM.last_name))->0 ELSE '{}' :: JSON END AS created_by_data,
    CASE WHEN COUNT(EM1.employee_id) > 0 THEN JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('first_name',EM1.first_name,'middle_name',EM1.middle_name,'last_name',EM1.last_name))->0 ELSE '{}' :: JSON END AS assigned_to_data

    FROM task_master TM
    LEFT JOIN employee_master EM ON EM.employee_id = TM._created_by
    LEFT JOIN employee_master EM1 ON EM1.employee_id = TM._assigned_to
    WHERE TM._company_id = '${company_id}' AND TM.is_deleted = 0
    GROUP BY TM.task_id`);

    const taskData = taskResult.rows.length > 0 ? taskResult.rows : [];

    response = {
      status: true,
      message: `Task list fetched successfully`,
      data: {
        taskData
      }
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
