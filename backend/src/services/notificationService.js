const pool = require("../config/db");
const { sendEmail } = require("./emailService");

const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
  channels = {
    inApp: true,
    email: false,
  },
}) => {
  try {
    let notification = null;
    let emailResult = null;

    // ============================================
    // 1. CREATE IN-APP NOTIFICATION
    // ============================================

    if (channels.inApp) {
      const notificationResult = await pool.query(
        `
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          related_entity_type,
          related_entity_id,
          is_read,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)
        RETURNING *
        `,
        [
          userId,
          type,
          title,
          message,
          relatedEntityType,
          relatedEntityId,
        ]
      );

      notification = notificationResult.rows[0];
    }

    // ============================================
    // 2. SEND EMAIL ONLY IF REQUESTED
    // ============================================

    if (channels.email) {
      // Get user's email only when email notification
      // is actually required.
      const userResult = await pool.query(
        `
        SELECT email
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: Boolean(notification),
          notificationCreated: Boolean(notification),
          emailSent: false,
          emailError: "User not found",
          notification,
        };
      }

      const userEmail = userResult.rows[0].email;

      emailResult = await sendEmail({
        to: userEmail,
        subject: title,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>${title}</h2>

            <p>${message}</p>

            <hr>

            <p style="font-size: 12px; color: #666;">
              This is an automated notification from INDUSTRIA360.
            </p>
          </div>
        `,
      });
    }

    // ============================================
    // 3. RETURN SEPARATE CHANNEL RESULTS
    // ============================================

    return {
      success: true,

      notificationCreated: Boolean(notification),

      emailSent: emailResult ? emailResult.success : false,

      emailError:
        emailResult && !emailResult.success
          ? emailResult.error
          : null,

      notification,
    };
  } catch (error) {
    console.error("Create notification error:", error);

    return {
      success: false,
      notificationCreated: false,
      emailSent: false,
      emailError: null,
      error: error.message,
    };
  }
};

module.exports = {
  createNotification,
};