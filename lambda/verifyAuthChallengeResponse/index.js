const aws = require("aws-sdk");

async function checkVerify(twilioClient, service, phoneNumber, code) {
  const check = await twilioClient.verify.v2
    .services(service)
    .verificationChecks.create({ to: phoneNumber, code: code });

  return check.status === "approved" ? true : false;
}

exports.handler = async (event, context) => {
  // fetch Twilio token
  const secret = await new aws.SSM()
    .getParameter({
      Name: process.env.TWILIO_TOKEN,
      WithDecryption: true,
    })
    .promise();

  // initiate  Twilio client
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = secret.Parameter.Value;
  const twilioClient = require("twilio")(accountSid, authToken);

  const verifyService = process.env.VERIFY_SERVICE_SID;
  const recipient = event.request.userAttributes.phone_number;
  const answer = event.request.challengeAnswer;

  const result = await checkVerify(
    twilioClient,
    verifyService,
    recipient,
    answer
  );

  event.response.answerCorrect = result;

  return event;
};
