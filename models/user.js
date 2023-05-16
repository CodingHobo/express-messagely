"use strict";

/** User of the site. */
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username,
                          password,
                          first_name,
                          last_name,
                          phone,
                          join_at,
                          last_login_at)
       VALUES
          ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
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

    return user && (await bcrypt.compare(password, user.password)) === true;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
         SET last_login_at = current_timestamp
         WHERE username = $1
         RETURNING username`,
      [username]
    );

    // TODO: is this a potential
    if (result.rows.length === 0) {
      throw new NotFoundError(`user ${username} not found`);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const users = await db.query(
      `SELECT username, first_name, last_name
      FROM users
      ORDER BY username
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

    const user = result.rows[0];

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
        m.to_username,
        u.first_name,
        u.last_name,
        u.phone
        FROM messages AS m
        JOIN users AS u
        ON m.to_username = u.username
        WHERE m.from_username = $1`,
      [username]
    );

    const messages = result.rows.map((message) => ({
      id: message.id,
      to_user: {
        username: message.to_username,
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

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id,
        m.body,
        m.sent_at,
        m.read_at,
        m.from_username,
        u.first_name,
        u.last_name,
        u.phone
        FROM messages AS m
        JOIN users AS u
        ON m.from_username = u.username
        WHERE m.to_username = $1`,
      [username]
    );

    const messages = result.rows.map((message) => ({
      id: message.id,
      from_user: {
        username: message.from_username,
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

  /**
   * Creates a 6 digit password reset code for a given user.
   * @param {string} username the username for whom we are creating the code
   * @returns {number} the reset code
   */
  static async createChangePasswordCode(username) {
    const code = Math.floor(100000 + Math.random() * 900000); // 6 digits

    const result = await db.query(`INSERT INTO password_reset_codes
     (for_username,
      reset_code,
      code_created_time)
    VALUES
      ($1, $2, current_timestamp)
    RETURNING reset_code`, [username, code]);

    return result.rows[0].reset_code;
  }

  /**
   * Attempts to reset a user's password with the given reset code.
   * @returns {boolean}: true iff the password was changed successfully
   */
  static async resetPasswordWithCode({ username, newPassword, resetCode }) {
    const codeResult = await db.query(
      `SELECT reset_code FROM password_reset_codes
       WHERE for_username = $1
       ORDER BY code_created_time DESC
       `, [username]);

    const generatedCode = codeResult.rows[0].reset_code;

    //TODO: check reset code timestamp still valid?

    //TODO: throw an error?
    if (Number(resetCode) !== generatedCode) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `UPDATE users
      SET password = $1
      WHERE username = $2
      RETURNING username`, [hashedPassword, username]);

    return result.rows.length === 1;
  }
}

module.exports = User;
