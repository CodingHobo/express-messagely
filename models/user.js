"use strict";

/** User of the site. */
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
           VALUES
             ($1, $2, $3, $4, $5, current_timestamp)
           RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
         FROM users
         WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) {
      return false;
    }

    return (await bcrypt.compare(password, user.password)) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username`,
      [username]
    );

    //TODO: is this what they wanted?
    if (result.rows.length === 0) {
      throw new Error(`user ${username} not found`);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    let users = await db.query(
      `SELECT username, first_name, last_name
      FROM users
      `
    );
    return users.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );

    let user = result.rows[0];

    if (!user) throw new NotFoundError(`no such User Exists: ${username}`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
        m.body,
        m.sent_at,
        m.read_at,
        u.username,
        u.first_name,
        u.last_name,
        u.phone
        FROM messages AS m
        JOIN users AS u
        ON m.to_username = u.username
        WHERE m.from_username = $1`,
      [username]
    );

    let messages = result.rows.map((message) => ({
      id: message.id,
      to_user: {
        username: message.username,
        first_name: message.first_name,
        last_name: message.last_name,
        phone: message.phone,
      },
      body: message.body,
      sent_at: message.sent_at,
      read_at: message.read_at,
    }));
    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {}
}

module.exports = User;
