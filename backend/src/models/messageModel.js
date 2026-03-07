const pool = require('../config/db');

const createMessage = async ({ id, senderId, receiverId, encryptedMessage, iv, status }) => {
  const query = `
    INSERT INTO messages (id, sender_id, receiver_id, encrypted_message, iv, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, sender_id, receiver_id, encrypted_message, iv, status, created_at
  `;
  const values = [id, senderId, receiverId, encryptedMessage, iv || null, status];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const updateMessageStatusForReceiver = async ({ messageId, receiverId, status }) => {
  const query = `
    UPDATE messages
    SET status = $1
    WHERE id = $2 AND receiver_id = $3
    RETURNING id, sender_id, receiver_id, encrypted_message, iv, status, created_at
  `;
  const { rows } = await pool.query(query, [status, messageId, receiverId]);
  return rows[0] || null;
};

const updateMessageStatus = async ({ messageId, status }) => {
  const query = `
    UPDATE messages
    SET status = $1
    WHERE id = $2
    RETURNING id, sender_id, receiver_id, encrypted_message, iv, status, created_at
  `;
  const { rows } = await pool.query(query, [status, messageId]);
  return rows[0] || null;
};

const listConversation = async ({ userId, peerUserId, limit, cursorCreatedAt, cursorId }) => {
  const params = [userId, peerUserId, limit];
  let cursorClause = '';

  if (cursorCreatedAt && cursorId) {
    params.push(cursorCreatedAt, cursorId);
    cursorClause = `
      AND (created_at, id) < ($4::timestamptz, $5::uuid)
    `;
  }

  const query = `
    SELECT id, sender_id, receiver_id, encrypted_message, iv, status, created_at
    FROM messages
    WHERE (
      (sender_id = $1 AND receiver_id = $2)
      OR
      (sender_id = $2 AND receiver_id = $1)
    )
    ${cursorClause}
    ORDER BY created_at DESC, id DESC
    LIMIT $3
  `;

  const { rows } = await pool.query(query, params);
  return rows;
};

module.exports = {
  createMessage,
  updateMessageStatusForReceiver,
  updateMessageStatus,
  listConversation
};
