const awsRequestHelper = require("./../../common/awsRequestHelper");
import { customMessages } from "../../common/constants";

exports.handler = async function (event, context, callback) {
  let resource = event.requestContext.resourcePath;
  switch (resource) {
    case "/message/add":
      const addMessageHandler = require("./add_message");
      return await addMessageHandler.handler(event, context, callback);

    case "/message/get-list":
      const getMessageHandler = require("./get_message_list");
      return await getMessageHandler.handler(event, context, callback);

    case "/message/conversation/get-list":
      const getConversationHandler = require("./get_conversation_list");
      return await getConversationHandler.handler(event, context, callback);
  }
  return awsRequestHelper.respondWithSimpleMessage(
    500,
    customMessages.SERVER_ERROR_TRY_AGAIN
  );
};
