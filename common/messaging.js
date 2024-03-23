const AWS = require("aws-sdk");

export const publishNotificationToSNS = async (payload) => {
  try {
    AWS.config.update({
      region: "us-west-1",
    });
    var params = {
      Message: JSON.stringify(payload),
      TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
    };
    console.log("params :", params);
    const sns = new AWS.SNS();
    await sns.publish(params).promise();
  } catch (error) {
    console.log("publishNotificationToSNS  ===> error", error);
  }
};
