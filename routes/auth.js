"use strict";

const jwt = require("jsonwebtoken");

const Router = require("express").Router;
const router = new Router();

const { UnauthorizedError, BadRequestError } = require("../expressError");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");

const User = require("../models/user");
const sendTextFromTwilio = require("../twilio");

const { ensureLoggedIn } = require("../middleware/auth");

/** POST /login: {username, password} => {token} */
router.post('/login', async function (req, res, next){
  if (req.body === undefined) throw new BadRequestError();

  const { username, password } = req.body;
  const loggedIn = await User.authenticate(username, password);

  if (loggedIn) {
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ token });
  }
  throw new UnauthorizedError("Invalid user/password");
})



/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const { username } = await User.register(req.body);

  const token = jwt.sign({ username }, SECRET_KEY);
  return res.json({ token });
});

/** POST /request-reset-password-code - generates a reset password code for the user
 *
 * => {message: "reset code sent to ${username}"}
 *
 **/
router.post('/request-reset-password-code', ensureLoggedIn, async function (req, res, next) {
  const user = await User.get(res.locals.user.username);
  const code = await User.createChangePasswordCode(user.username);

  sendTextFromTwilio({
    body: `Messagely Password Reset Code: ${code}`,
    to: user.phone
  });

  return res.json({ message: `reset code sent to ${user.username}` });
});


/** POST /reset-password - resets a user's password if they provide
 * the reset code that was texted to their phone
 *
 * { new_password, reset_code } => {message: "password changed successfully!"}
 *  OR {message: "invalid code!"}
 *
 **/
router.post('/reset-password', ensureLoggedIn, async function (req, res, next) {
  const user = await User.get(res.locals.user.username);
  const isResetSuccessful = await User.resetPasswordWithCode({
    username: user.username,
    newPassword: req.body.new_password,
    resetCode: req.body.reset_code
  });

  const message = isResetSuccessful ? "password changed successfully!" :
    "invalid code!";

  return res.json({ message });
});

module.exports = router;