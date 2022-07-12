const aws = require("aws-sdk");

async function startVerify(twilioClient, service, phoneNumber) {
  await twilioClient.verify.v2
    .services(service)
    .verifications.create({ to: phoneNumber, channel: "sms" });
}

exports.handler = async (event, context) => {
  // This is a new auth session, send login code to user
  if (!event.request.session || !event.request.session.length) {
    // Fetch Twilio token
    const secret = await new aws.SSM()
      .getParameter({
        Name: process.env.TWILIO_TOKEN,
        WithDecryption: true,
      })
      .promise();

    // Initiate Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = secret.Parameter.Value;
    const twilioClient = require("twilio")(accountSid, authToken);

    const verifyService = process.env.VERIFY_SERVICE_SID;
    const recipient = event.request.userAttributes.phone_number;

    await startVerify(twilioClient, verifyService, recipient);

    event.response.publicChallengeParameters = {
      phoneNumber: event.request.userAttributes.phone_number,
    };
  }

  return event;
};
