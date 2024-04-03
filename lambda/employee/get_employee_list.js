const awsRequestHelper = require("../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";
import utils from "../../common/utils";
const { DBManager } = require("../../common/dbmanager");
const DB = new DBManager();

export const handler = async function (event, context, callback) {
  let response = {
    status: false,
    message: customMessages.SERVER_ERROR_TRY_AGAIN,
  };

  try {
    const { company_id } = await utils.verifyEmployee(
      event.headers.Authorization
    );

    const empResult = await DB.runQuery(`SELECT 
    EM.employee_id,
    EM.first_name,
    EM.middle_name,
    EM.last_name
    FROM employee_master EM
    WHERE EM.company_id = '${company_id}' AND EM.is_deleted = 0`);

    const empData = empResult.rows.length > 0 ? empResult.rows[0] : null;

    response = {
      status: true,
      message: "Employee fetched successfully",
      data: { empData },
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
