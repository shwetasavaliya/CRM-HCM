const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const Joi = require("joi");
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();

const validate = function (body) {
  const schema = Joi.object().keys({
    link_token: Joi.string().required(),
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
    let { link_token } = apiData;

    const linkResult = await DB.runQuery(`SELECT 
    LTM.link_id,
    LTM.link_token,
    LTM._customer_id,
    LTM._employee_id,
    EM.company_id,
    EM.role
    FROM link_token_master LTM 
    LEFT JOIN employee_master EM ON EM.employee_id = LTM._employee_id AND EM.is_deleted = 0
    WHERE LTM.link_token = '${link_token}' AND LTM.is_deleted = 0`);

    const linkData = linkResult.rows.length > 0 ? linkResult.rows[0] : null;

    if (!linkData) {
      throw new Error("Invalid Link Token");
    }

    const customerResult = await DB.runQuery(`SELECT 
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
      CASE WHEN COUNT(DM.documents_id) > 0 THEN JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('documents_id',DM.documents_id,'aadhar_number',DM.aadhar_number,'aadhar_front_url',DM.aadhar_front_url,'aadhar_back_url',DM.aadhar_back_url,'pancard_number',DM.pancard_number,'pancard_url',DM.pancard_url,'passport_number',DM.passport_number,'passport_url',DM.passport_url,'passport_expiry_date',DM.passport_expiry_date,'voting_url',DM.voting_url,'birth_certificate_url',DM.birth_certificate_url,'caste_certificate_url',DM.caste_certificate_url,'leaving_certificate_url',DM.leaving_certificate_url,'driving_number',DM.driving_number,'driving_url',DM.driving_url,'light_bill_urls',DM.light_bill_urls,'itr_file_number',DM.itr_file_number,'itr_file_name',DM.itr_file_name,'bank_detail_urls',DM.bank_detail_urls ))->0 ELSE '{}' :: JSON END documents
      FROM customer_master CM
      LEFT JOIN documents_master DM ON CM.customer_uuid = DM._customer_id AND DM.is_deleted = 0
      WHERE CM.is_deleted = 0 AND CM.customer_uuid = '${linkData._customer_id}'
      GROUP BY CM.customer_id`);

    const customerData =
      customerResult.rows.length > 0 ? customerResult.rows[0] : {};

    var payload = {
      company_id: linkData.company_id,
      employee_id: linkData._employee_id,
      role: linkData.role,
    };

    var token = utils.createEmployeeJWT(payload, "30d");

    response = {
      status: true,
      message: "Token generated successfully",
      data: { token, customerData },
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
