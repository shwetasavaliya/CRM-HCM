const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";

exports.handler = async function (event, context, callback) {
  let resource = event.requestContext.resourcePath;
  switch (resource) {
    case "/task/manage-task":
        const manageTaskHandler = require("./manage_task");
        return await manageTaskHandler.handler(event, context, callback);

  }
  return awsRequestHelper.respondWithSimpleMessage(
    500,
    customMessages.SERVER_ERROR_TRY_AGAIN
  );
};
