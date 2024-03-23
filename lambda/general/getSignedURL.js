import moment from "moment";
import utils from "../../common/utils";
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-west-1", signatureVersion: "v4" });
const s3 = new AWS.S3();
const awsRequestHelper = require("./../../common/awsRequestHelper");
const { v4: uuidv4 } = require("uuid");

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300;

function toSeoUrl(url) {
  return url
    .toString() // Convert to string
    .normalize("NFD") // Change diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove illegal characters
    .replace(/\s+/g, "-") // Change whitespace to dashes
    .toLowerCase() // Change to lowercase
    .replace(/&/g, "-and-") // Replace ampersand
    .replace(/[^a-z0-9\-.]/g, "") // Remove anything that is not a letter, number or dash
    .replace(/-+/g, "-") // Remove duplicate dashes
    .replace(/^-*/, "") // Remove starting dashes
    .replace(/-*$/, ""); // Remove trailing dashes
}

// Main Lambda entry point
export const handler = async (event) => {
  return await getUploadURL(event);
};

const getUploadURL = async function (event) {
  var folderName = "images";
  var fileName = `${uuidv4()}.jpg`;
  var contentType = "image/jpeg";

  if (utils.isJson(event.body)) {
    let apiData = JSON.parse(event.body);
    folderName = apiData?.folder || folderName;
    fileName = apiData?.file_name || fileName;
    contentType = apiData?.content_type || contentType;
  }

  fileName = toSeoUrl(fileName);

  const fileUniqueName = moment.utc().valueOf();
  const Key = `${folderName}/${fileUniqueName}-${fileName}`;

  // Get signed URL from S3
  const s3Params = {
    Bucket: process.env.S3_DATA_BUCKET,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: contentType,
    ACL: "public-read",
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", s3Params);

  var response = {
    uploadURL: uploadURL,
    Key,
  };

  return awsRequestHelper.respondWithJsonBody(200, response);
};
