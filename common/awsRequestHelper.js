export const callbackRespondWithCodeOnly = function (callback, statusCode) {
  callback(null, {
    statusCode: Number.isInteger(statusCode) ? Number(statusCode) : 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  });
};

export const callbackRespondWithSimpleMessage = function (
  callback,
  statusCode,
  message
) {
  callback(null, {
    statusCode: Number.isInteger(statusCode) ? Number(statusCode) : 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      message: message,
    }),
  });
};

export const callbackRespondWithJsonBody = function (
  callback,
  statusCode,
  body
) {
  callback(null, {
    statusCode: Number.isInteger(statusCode) ? Number(statusCode) : 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(body),
  });
};

export const respondWithCodeOnly = function (statusCode) {
  return {
    statusCode: Number.isInteger(statusCode) ? Number(statusCode) : 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };
};

export const respondWithSimpleMessage = function (statusCode, message) {
  return {
    statusCode: Number.isInteger(statusCode) ? Number(statusCode) : 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      message: message,
    }),
  };
};

export const respondWithJsonBody = function (statusCode, body) {
  if (statusCode === 400) {
    var message = body?.message || "";
    message = message.replace(/_/g, " ");
    message = message.replace(/"/g, "");
    body["message"] = capitalize(message);
  }
  return {
    statusCode: Number.isInteger(statusCode) ? Number(statusCode) : 500,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(body),
  };
};

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);
