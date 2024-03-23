import moment from "moment";
var AWS = require("aws-sdk");
const { DBManager } = require("./../common/dbmanager");
var bcrypt = require("bcryptjs");

AWS.config.update({ region: "us-east-1" });

const DBObj = new DBManager();
const saltRounds = 10;

export async function sendTextSMS(userId = null, message, phoneNumber = null) {
  try {
    var phone_numbers = [];
    if (userId) {
      var sqlQry = `SELECT phone_number FROM user_master WHERE user_id = '${userId}'`;
      var results = await DBObj.runQuery(sqlQry);
      var rows = results?.rows || [];

      rows.forEach((item) => {
        phone_numbers.push(item["phone_number"]);
      });
    } else if (phoneNumber) {
      phone_numbers.push(phoneNumber);
    } else {
      return;
    }

    if (phone_numbers.length > 0) {
      var originationNumber = "+18446062092";
      var destinationNumber = phone_numbers[0];
      var applicationId = "ce47e780ab3a4fbb9aef28c81242c8e6";
      var pinpoint = new AWS.Pinpoint();

      // Specify the parameters to pass to the API.
      var params = {
        ApplicationId: applicationId,
        MessageRequest: {
          Addresses: {
            [destinationNumber]: {
              ChannelType: "SMS",
            },
          },
          MessageConfiguration: {
            SMSMessage: {
              Body: message,
              Keyword: "KEYWORD_359620610124",
              MessageType: "TRANSACTIONAL",
              OriginationNumber: originationNumber,
              SenderId: "OUROAPP",
            },
          },
        },
      };

      pinpoint.sendMessages(params, function (err, data) {
        // If something goes wrong, print an error message.
        if (err) {
          console.log(err.message);
          // Otherwise, show the unique ID for the message.
        } else {
          console.log(
            "Message sent! " +
              data["MessageResponse"]["Result"][destinationNumber][
                "StatusMessage"
              ]
          );
        }
      });
    }
  } catch (err) {
    console.log("Sms Err>>", err);
  }
}

export async function sendOTPCode(email_id, type) {
  let response = {
    status: false,
    message: "Sorry OTP could not send! Please try again later",
  };
  try {
    var whereQry = { email_id: email_id, action_type: type };

    await DBObj.dataDeleteItems("verification_otp_master", whereQry);

    var OTP = Math.floor(100000 + Math.random() * 900000);

    var expirationTime = moment().add(10, "minutes").valueOf();

    var hashKey = `${email_id}##${OTP}`;
    const salt = bcrypt.genSaltSync(saltRounds);
    const secertHash = bcrypt.hashSync(hashKey, salt);
    var insertObj = {
      email_id: email_id,
      secret_otp: OTP,
      secret_hash: secertHash,
      expiration_time: expirationTime,
      action_type: type,
    };

    await DBObj.dataInsert("verification_otp_master", insertObj);

    response = {
      status: true,
      message: "OTP sent successfully!",
    };
    return response;
  } catch (err) {
    console.log("OTP Code Err>>", err);
    return response;
  }
}

export async function verifyOTPCode(email_id, type, otp_code) {
  let response = {
    status: false,
    message: "Invalid OTP! Please enter valid OTP",
  };
  try {
    var whereCheckQry = { email_id: email_id, action_type: type };
    var result = await DBObj.getData(
      "verification_otp_master",
      "*",
      whereCheckQry
    );
    var row = result?.rows || [];
    if (row.length > 0) {
      var otpInfo = row[0];

      if (otp_code && otpInfo["secret_hash"] === otp_code) {
        response = {
          status: true,
          otp_id: otpInfo["verification_otp_id"],
        };
      }
    }
    return response;
  } catch (err) {
    console.log("OTP Code Err>>", err);
    return response;
  }
}

export const parseNotificationText = (notificationMsg, data) => {
  for (const key in data) {
    notificationMsg = notificationMsg.replace(
      new RegExp(`##${key}##`, "g"),
      `${data[key]}`
    );
  }
  notificationMsg = notificationMsg.replace(/^\/|\/$/g, "");
  return notificationMsg;
};
