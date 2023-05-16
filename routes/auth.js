"use strict";

const jwt = require("jsonwebtoken");

const Router = require("express").Router;
const router = new Router();

const { UnauthorizedError, BadRequestError } = require("../expressError");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");

const User = require("../models/user");

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
})


module.exports = router;