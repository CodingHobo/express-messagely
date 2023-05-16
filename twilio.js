'use strict';

const { ACCT_SID, AUTH_TOKEN, PHONE } = require('./config');

const client = require('twilio')(ACCT_SID, AUTH_TOKEN);

  async function sendMsg ({msgBody, recipient}) {
    console.log("recipient", recipient);
    client.messages
    .create({
       body: msgBody,
       from: PHONE,
       to: recipient
     })
    .then(message => console.log(message.sid))
  }


module.exports = sendMsg;