"use strict";

const { UnauthorizedError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");
const sendMsg = require('../twilio')

const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
    const message = await Message.get(req.params.id);

    const currentUserName = res.locals.user.username;

    if (currentUserName !== message.from_user.username
        && currentUserName !== message.to_user.username) {
        throw new UnauthorizedError();
    }

    return res.json({ message });
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async function (req, res, next) {
    req.body.from_username = res.locals.user.username; //FIXME: refactor this

    const message = await Message.create(req.body);
    const recipName = message.to_username;
    const phoneNum = await User.get(recipName).phone

    sendMsg({msgBody: `You've got a new message`, recipient: phoneNum} )
    return res.json({ message });
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function (req, res, next) {
    const currentUsername = res.locals.user.username;

    const message = await Message.get(req.params.id);

    if (currentUsername !== message.to_user.username) {
        throw new UnauthorizedError("Cannot set message to read");
    }

    const readMessage = await Message.markRead(req.params.id);

    return res.json({ message: readMessage });
});


module.exports = router;