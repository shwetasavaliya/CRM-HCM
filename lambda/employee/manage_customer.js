const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const { DBManager } = require("../../common/dbmanager");
const DBObj = new DBManager();
const Joi = require("joi");

const validateAction = function (body) {
  const ListAction = [
    "edit_customer",
    "get_customer_details",
    "get_customer_list",
    "delete_customer",
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

const validateEditCustomer = function (body) {
  const schema = Joi.object().keys({
    customer_id: Joi.string().required(),
    first_name: Joi.string().optional(),
    middle_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    mobile_number: Joi.string().optional(),
    gender: Joi.string().optional(),
    aadhar_number: Joi.string().optional().allow("", null),
    aadhar_front_url: Joi.string().optional().allow("", null),
    aadhar_back_url: Joi.string().optional().allow("", null),
    pancard_number: Joi.string().optional().allow("", null),
    pancard_url: Joi.string().optional().allow("", null),
    passport_number: Joi.string().optional().allow("", null),
    passport_url: Joi.string().optional().allow("", null),
    passport_expiry_date: Joi.string().optional().allow("", null),
    voting_url: Joi.string().optional().allow("", null),
    birth_certificate_url: Joi.string().optional().allow("", null),
    leaving_certificate_url: Joi.string().optional().allow("", null),
    caste_certificate_url: Joi.string().optional().allow("", null),
    user_image_url: Joi.string().optional().allow("", null),
    driving_number: Joi.string().optional().allow("", null),
    driving_url: Joi.string().optional().allow("", null),
    light_bill_urls: Joi.array().items(Joi.string()).optional(),
    is_married: Joi.boolean().optional(),
    date_of_birth: Joi.string().optional(),
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

const validateGetCustomer = function (body) {
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

const validateDeleteCustomer = function (body) {
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
    const { company_id } = await utils.verifyEmployee(
      event.headers.Authorization
    );
    let apiData = JSON.parse(event.body);
    await validateAction(apiData);
    const { action } = apiData;

    switch (action) {
      case "edit_customer":
        await validateEditCustomer(apiData);
        return await editCustomer(apiData);

      case "get_customer_details":
        await validateGetCustomer(apiData);
        return await getCustomer(apiData);

      case "get_customer_list":
        return await getCustomerList(company_id);

      case "delete_customer":
        await validateDeleteCustomer(apiData);
        return await deleteCustomer(apiData);

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

const editCustomer = async function (apiData, userId) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let {
      customer_id,
      first_name,
      middle_name,
      last_name,
      mobile_number,
      gender,
      aadhar_number,
      aadhar_front_url,
      aadhar_back_url,
      pancard_number,
      pancard_url,
      passport_number,
      passport_url,
      passport_expiry_date,
      voting_url,
      birth_certificate_url,
      leaving_certificate_url,
      caste_certificate_url,
      user_image_url,
      is_married,
      driving_number,
      driving_url,
      light_bill_urls = [],
      date_of_birth,
    } = apiData;

    const [customerResult, documentsResult] = await Promise.all([
      DBObj.runQuery(
        `SELECT * FROM customer_master WHERE customer_uuid = '${customer_id}' AND is_deleted = 0`
      ),
      DBObj.runQuery(
        `SELECT * FROM documents_master WHERE _customer_id = '${customer_id}' AND is_deleted = 0`
      ),
    ]);

    const customerData =
      customerResult.rows.length > 0 ? customerResult.rows[0] : null;

    const documentsData =
      documentsResult.rows.length > 0 ? documentsResult.rows[0] : {};

    if (!customerData) {
      throw new Error("Customer not found!");
    }

    let updateObj = {
      first_name,
      middle_name,
      last_name,
      mobile_number,
      gender,
      user_image_url,
      is_married,
      date_of_birth,
    };

    let documentsObj = {
      aadhar_number,
      aadhar_front_url,
      aadhar_back_url,
      pancard_number,
      pancard_url,
      passport_number,
      passport_url,
      passport_expiry_date,
      voting_url,
      birth_certificate_url,
      leaving_certificate_url,
      caste_certificate_url,
      driving_number,
      driving_url,
      light_bill_urls: JSON.stringify(light_bill_urls),
    };

    let promise = [];

    promise.push(
      DBObj.dataUpdate("customer_master", updateObj, {
        customer_uuid: customer_id,
      })
    );

    if (Object.keys(documentsData).length > 0) {
      promise.push(
        DBObj.dataUpdate("documents_master", documentsObj, {
          _customer_id: customerData.customer_uuid,
        })
      );
    } else {
      documentsObj._customer_id = customerData.customer_uuid;
      promise.push(DBObj.dataInsert("documents_master", documentsObj));
    }

    if (promise.length > 0) await Promise.all(promise);

    response = {
      status: true,
      message: `Customer edited successfully.`,
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

const getCustomer = async function (apiData, userId) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { customer_id } = apiData;

    const customerResult = await DBObj.runQuery(`SELECT 
      CM.customer_id,
      CM.customer_uuid,
      CM._company_id,
      CM.first_name,
      CM.middle_name,
      CM.last_name,
      CM.mobile_number,
      CM.user_name,
      CM.email_id,
      CM.password,
      CM.gender,
      CM.user_image_url,
      CM.is_active,
      CM.is_first_login,
      CM.is_married,
      CM.date_of_birth,
      CM.date_created,
      CASE WHEN COUNT(DM.documents_id) > 0 THEN JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('documents_id',DM.documents_id,'aadhar_number',DM.aadhar_number,'aadhar_front_url',DM.aadhar_front_url,'aadhar_back_url',DM.aadhar_back_url,'pancard_number',DM.pancard_number,'pancard_url',DM.pancard_url,'passport_number',DM.passport_number,'passport_url',DM.passport_url,'passport_expiry_date',DM.passport_expiry_date,'voting_url',DM.voting_url,'birth_certificate_url',DM.birth_certificate_url,'caste_certificate_url',DM.caste_certificate_url,'leaving_certificate_url',DM.leaving_certificate_url,'driving_number',DM.driving_number,'driving_url',DM.driving_url,'light_bill_urls',DM.light_bill_urls ))->0 ELSE '{}' :: JSON END documents
      FROM customer_master CM
      LEFT JOIN documents_master DM ON CM.customer_uuid = DM._customer_id AND DM.is_deleted = 0
      WHERE CM.is_deleted = 0 AND CM.customer_uuid = '${customer_id}'
      GROUP BY CM.customer_id`);

    const customerData =
      customerResult.rows.length > 0 ? customerResult.rows[0] : {};

    response = {
      status: true,
      message: `Customer fetched successfully.`,
      data: {
        customerData,
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

const getCustomerList = async function (company_id) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    const customerResult = await DBObj.runQuery(`SELECT 
      CM.customer_id,
      CM.customer_uuid,
      CM._company_id,
      CM.first_name,
      CM.middle_name,
      CM.last_name,
      CM.mobile_number,
      CM.user_name,
      CM.email_id,
      CM.password,
      CM.gender,
      CM.user_image_url,
      CM.is_active,
      CM.is_first_login,
      CM.is_married,
      CM.date_created,
      CM.date_of_birth,
      CASE WHEN COUNT(DM.documents_id) > 0 THEN JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('documents_id',DM.documents_id,'aadhar_number',DM.aadhar_number,'aadhar_front_url',DM.aadhar_front_url,'aadhar_back_url',DM.aadhar_back_url,'pancard_number',DM.pancard_number,'pancard_url',DM.pancard_url,'passport_number',DM.passport_number,'passport_url',DM.passport_url,'passport_expiry_date',DM.passport_expiry_date,'voting_url',DM.voting_url,'birth_certificate_url',DM.birth_certificate_url,'caste_certificate_url',DM.caste_certificate_url,'leaving_certificate_url',DM.leaving_certificate_url,'driving_number',DM.driving_number,'driving_url',DM.driving_url,'light_bill_urls',DM.light_bill_urls ))->0 ELSE '{}' :: JSON END documents
      FROM customer_master CM
      LEFT JOIN documents_master DM ON CM.customer_uuid = DM._customer_id AND DM.is_deleted = 0
      WHERE CM.is_deleted = 0 AND CM._company_id = '${company_id}'
      GROUP BY CM.customer_id`);

    const customerData =
      customerResult.rows.length > 0 ? customerResult.rows : [];

    response = {
      status: true,
      message: `Customer fetched successfully.`,
      data: {
        customerData,
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

const deleteCustomer = async function (apiData, userId) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    let { customer_id } = apiData;

    const customerResult = await DBObj.runQuery(
      `SELECT * FROM customer_master WHERE customer_uuid = '${customer_id}' AND is_deleted = 0`
    );

    const customerData =
      customerResult.rows.length > 0 ? customerResult.rows[0] : null;

    if (!customerData) {
      throw new Error("Customer not found!");
    }

    await Promise.all([
      DBObj.dataUpdate(
        "customer_master",
        { is_deleted: 1 },
        { customer_uuid: customer_id }
      ),
      DBObj.dataUpdate(
        "documents_master",
        { is_deleted: 1 },
        { _customer_id: customer_id }
      ),
    ]);

    response = {
      status: true,
      message: `Customer deleted successfully.`,
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
