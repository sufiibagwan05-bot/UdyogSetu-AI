const pool = require("../config/db");
const { createNotification } = require("./notificationService");

const respondToQuery = async (
  queryId,
  entrepreneurUserId,
  responseText
) => {
  // Check query and application ownership
  const queryResult = await pool.query(
    `
    SELECT
      aq.id,
      aq.application_id,
      aq.raised_by,
      aq.status,
      a.submitted_by
    FROM application_queries aq
    JOIN applications a
      ON a.id = aq.application_id
    WHERE aq.id = $1
    `,
    [queryId]
  );

  if (queryResult.rows.length === 0) {
    return { error: "QUERY_NOT_FOUND" };
  }

  const query = queryResult.rows[0];

  // Only the entrepreneur who submitted the application can respond
  if (query.submitted_by !== entrepreneurUserId) {
    return { error: "ACCESS_DENIED" };
  }

  // Only OPEN queries can be answered
  if (query.status !== "OPEN") {
    return { error: "INVALID_QUERY_STATUS" };
  }

  // Validate response
  if (!responseText || !responseText.trim()) {
    return { error: "RESPONSE_TEXT_REQUIRED" };
  }

  const result = await pool.query(
    `
    UPDATE application_queries
    SET
      response_text = $1,
      status = 'RESPONDED',
      responded_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      application_id,
      raised_by,
      query_text,
      response_text,
      status,
      raised_at,
      responded_at,
      resolved_at
    `,
    [
      responseText.trim(),
      queryId,
    ]
  );

  await createNotification({
  userId: query.raised_by,
  type: "QUERY_RESPONSE_SUBMITTED",
  title: "Query Response Submitted",
  message: `The entrepreneur has submitted a response to the query for application ${query.application_id}.`,
  relatedEntityType: "APPLICATION",
  relatedEntityId: query.application_id,
  channels: {
    inApp: true,
    email: false,
  },
});

  return {
    query: result.rows[0],
  };
};

module.exports = {
  respondToQuery,
};