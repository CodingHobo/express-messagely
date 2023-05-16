"use strict";

/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const DB_URI = (process.env.NODE_ENV === "test")
    ? "postgresql:///messagely_test"
    : "postgresql:///messagely";

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const ACCT_SID = process.env.Account_SID;
const AUTH_TOKEN = process.env.AuthToken;
const PHONE = process.env.PhoneNum;

const BCRYPT_WORK_FACTOR = 12;


module.exports = {
  DB_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  ACCT_SID,
  AUTH_TOKEN,
  PHONE
};