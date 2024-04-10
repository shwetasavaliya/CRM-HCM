const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();

const validateAction = function (body) {
  const ListAction = ["add_note", "edit_note", "get_notes_list", "delete_note"];
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

const validateAddNote = function (body) {
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    note_date: Joi.string().required(),
    color_code: Joi.string().required(),
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

const validateEditNote = function (body) {
  const schema = Joi.object().keys({
    note_id: Joi.number().required(),
    title: Joi.string().optional(),
    note_date: Joi.string().optional(),
    color_code: Joi.string().optional(),
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

const validateDeleteNote = function (body) {
  const schema = Joi.object().keys({
    note_id: Joi.number().required(),
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
      case "add_note":
        await validateAddNote(apiData);
        return await addNote(apiData, company_id);

      case "edit_note":
        await validateEditNote(apiData);
        return await editNote(apiData);

      case "delete_note":
        await validateDeleteNote(apiData);
        return await deleteNote(apiData);

      case "get_notes_list":
        return await getNotes(company_id);

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

const addNote = async function (apiData, company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { title, note_date, description, color_code } = apiData;

    let noteObj = {
      _company_id: company_id,
      title,
      note_date,
      description,
      color_code,
    };

    await DB.dataInsert("notes_master", noteObj);

    response = {
      status: true,
      message: `Note created successfully`,
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

const editNote = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { note_id, title, note_date, description, color_code } = apiData;

    const noteResult = await DB.runQuery(
      `SELECT * FROM notes_master WHERE note_id = ${note_id} AND is_deleted = 0`
    );

    const noteData = noteResult.rows.length > 0 ? noteResult.rows[0] : null;

    if (!noteData) {
      throw new Error("Note not found.");
    }

    let updateObj = {};

    if (title) updateObj.title = title;
    if (note_date) updateObj.note_date = note_date;
    if (description) updateObj.description = description;
    if (color_code) updateObj.color_code = color_code;

    if (Object.keys(updateObj).length > 0) {
      await DB.dataUpdate("notes_master", updateObj, {
        note_id,
      });
    }

    response = {
      status: true,
      message: `Note updated successfully`,
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

const deleteNote = async function (apiData) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { note_id } = apiData;

    const noteResult = await DB.runQuery(
      `SELECT * FROM notes_master WHERE note_id = ${note_id} AND is_deleted = 0`
    );

    const noteData = noteResult.rows.length > 0 ? noteResult.rows[0] : null;

    if (!noteData) {
      throw new Error("Note not found.");
    }

    await DB.dataUpdate("notes_master", { is_deleted: 1 }, { note_id });

    response = {
      status: true,
      message: `Note deleted successfully`,
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

const getNotes = async function (company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    const notesResult = await DB.runQuery(`SELECT 
    NM.note_id,
    NM._company_id,
    NM.title,
    NM.note_date,
    NM.color_code,
    NM.description,
    NM.date_created

    FROM notes_master NM
    
    WHERE NM.is_deleted = 0 AND NM._company_id = '${company_id}'`);

    const notesData = notesResult.rows.length > 0 ? notesResult.rows : [];

    response = {
      status: true,
      message: `Notes list fetched successfully`,
      data: {
        notesData,
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
