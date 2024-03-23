import escapeStringRegexp from "escape-string-regexp";
const jwt = require("jsonwebtoken");
import moment from "moment";

const getCurrentDate = () => {
  var date = moment().utc().format("YYYY-MM-DD HH:mm:ss");
  return date;
};

//Create JWT
const createCustomerJWT = (parsedBody, expire = "30d") => {
  //var dt = new Date();
  //dt.setMonth(dt.getMonth() + 1);
  //parsedBody.exp = Math.round(dt.getTime() / 1000);
  let options = {
    expiresIn: expire,
  };
  return jwt.sign(parsedBody, process.env.SHARED_SECRET, options);
};

const createEmployeeJWT = (parsedBody, expire = "30d") => {
  let options = {
    expiresIn: expire,
  };
  return jwt.sign(parsedBody, process.env.SHARED_SECRET, options);
};

//Verify TOKEN
const verifyCustomerJWT = (token) => {
  if (token) {
    return jwt.verify(token, process.env.SHARED_SECRET);
  } else {
    return { status_code: 401, message: "Unauthorized" };
  }
};

const verifyEmployeeJWT = (token) => {
  if (token) {
    return jwt.verify(token, process.env.SHARED_SECRET);
  } else {
    return { status_code: 401, message: "Unauthorized" };
  }
};

const verifyCustomer = function (jwtToken) {
  return new Promise((resolve, reject) => {
    try {
      var parts = jwtToken.split(" ");
      if (parts.length === 2) {
        var scheme = parts[0];
        var credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          let user = verifyCustomerJWT(credentials);
          if (user && user.id) {
            resolve(user);
          }
        }
      }
      reject({ status_code: 401, message: "Unauthorized" });
    } catch (error) {
      reject({ status_code: 401, message: "Unauthorized" });
    }
  });
};

const verifyEmployee = function (jwtToken) {
  return new Promise((resolve, reject) => {
    try {
      var parts = jwtToken.split(" ");
      if (parts.length === 2) {
        var scheme = parts[0];
        var credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
          let user = verifyEmployeeJWT(credentials);
          if (user && user.employee_id) {
            resolve(user);
          }
        }
      }
      reject({ status_code: 401, message: "Unauthorized" });
    } catch (error) {
      reject({ status_code: 401, message: "Unauthorized" });
    }
  });
};

const toTitleCase = (phrase) => {
  if (phrase) {
    return phrase
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return "";
};

//upload Image
const uploadImg = async (key, bucket, Body, ContentType) => {
  try {
    const AWS = require("aws-sdk");
    const S3 = new AWS.S3();

    let params = {
      Body: Body,
      Bucket: bucket,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: ContentType,
      Key: key,
    };

    await S3.putObject(params).promise();
    return `https://s3.${process.env.REGION}.amazonaws.com/${bucket}/${key}`;
  } catch (error) {
    console.error("error : ", error);
    return error;
  }
};

const escapeString = function (val) {
  val = escapeStringRegexp(val);
  val = val.replace(/'/g, `\\'`);
  return val;
};

const escapeQuoteString = function (val) {
  val = val.replace(/'/g, `\\'`);
  val = val.replace(/\"/g, `\\"`);
  return val;
};

const isJson = function (str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const convertArrayToString = function (arr) {
  return arr.length ? "'" + arr.join("', '") + "'" : "";
};

const zeroPad = (num, places) => String(num).padStart(places, "0");

const generateRandomNumber = (length) => {
  return Math.floor(
    Math.pow(10, length - 1) +
      Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1)
  );
};

//Check is it LocalHost
const isLocalHost = (events) => {
  var host = events["headers"]["Host"];
  if (host.includes("localhost")) {
    return true;
  }
  return false;
};

const generateBarcode = (data, size = "500") => {
  var qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;

  return qrCodeImage;
};

const getUniqueCode = function (length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export default {
  verifyCustomer,
  verifyCustomerJWT,
  createCustomerJWT,
  verifyEmployee,
  verifyEmployeeJWT,
  createEmployeeJWT,
  toTitleCase,
  uploadImg,
  getCurrentDate,
  escapeString,
  escapeQuoteString,
  isJson,
  zeroPad,
  generateRandomNumber,
  convertArrayToString,
  isLocalHost,
  generateBarcode,
  getUniqueCode,
};
