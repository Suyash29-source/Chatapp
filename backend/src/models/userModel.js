const pool = require('../config/db');

const createUser = async ({ id, email, passwordHash }) => {
  const query = `
    INSERT INTO users (id, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, email, public_key, created_at
  `;
  const values = [id, email, passwordHash];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const findUserByEmail = async (email) => {
  const query = `
    SELECT id, email, password_hash, public_key, created_at
    FROM users
    WHERE email = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

const findUserById = async (id) => {
  const query = `
    SELECT id, email, public_key, created_at
    FROM users
    WHERE id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
