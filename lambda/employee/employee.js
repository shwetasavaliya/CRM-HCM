const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";

exports.handler = async function (event, context, callback) {
  let resource = event.requestContext.resourcePath;
  switch (resource) {
    case "/employee/register":
      const registerEmpHandler = require("./register_employee");
      return await registerEmpHandler.handler(event, context, callback);

    case "/employee/login":
      const loginEmpHandler = require("./login");
      return await loginEmpHandler.handler(event, context, callback);

    case "/employee/customer-register":
      const registerCusHandler = require("./register_customer");
      return await registerCusHandler.handler(event, context, callback);

    case "/employee/manage-customer":
      const manageCustomerHandler = require("./manage_customer");
      return await manageCustomerHandler.handler(event, context, callback);

    case "/employee/manage-itr":
      const manageITRHandler = require("./manage_itr");
      return await manageITRHandler.handler(event, context, callback);

    case "/employee/link-token/generate":
      const generateLinkTokenHandler = require("./generate_link_token");
      return await generateLinkTokenHandler.handler(event, context, callback);

    case "/employee/employee-token/generate":
      const generateEmpTokenHandler = require("./generate_emp_token");
      return await generateEmpTokenHandler.handler(event, context, callback);

    case "/employee/get-list":
      const employeeListHandler = require("./get_employee_list");
      return await employeeListHandler.handler(event, context, callback);

    case "/employee/manage-employee":
      const manageEmployeeHandler = require("./manage_employee");
      return await manageEmployeeHandler.handler(event, context, callback);
  }
  return awsRequestHelper.respondWithSimpleMessage(
    500,
    customMessages.SERVER_ERROR_TRY_AGAIN
  );
};
