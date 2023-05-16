"use strict";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_ACCOUNT_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = require("./config");

const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_ACCOUNT_AUTH_TOKEN);

async function sendTextFromTwilio({ body, to }) {
  const message = await client.messages.create({
    body,
    from: TWILIO_PHONE_NUMBER,
    to,
  });
  console.log(message.sid);
}

module.exports = sendTextFromTwilio;
