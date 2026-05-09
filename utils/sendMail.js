const axios = require("axios");

const otpTemplate = (otp, email) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- HEADER -->
        <tr>
          <td style="background:#534AB7;padding:32px;text-align:center;">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
              <span style="color:#fff;font-size:24px;">📷</span>
            </div>
            <p style="color:#ffffff;font-size:18px;font-weight:600;margin:0;">SmartEditor AI</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 32px 16px;">
            <p style="font-size:22px;font-weight:600;color:#111827;margin:0 0 8px;">Password Reset</p>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your password. Use the OTP code below to proceed. 
              This code expires in <strong>10 minutes</strong>.
            </p>

            <!-- OTP BOX -->
            <div style="background:#EEEDFE;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <p style="font-size:12px;color:#534AB7;font-weight:600;margin:0 0 8px;letter-spacing:0.05em;">YOUR VERIFICATION CODE</p>
              <p style="font-size:40px;font-weight:700;color:#3C3489;letter-spacing:0.3em;margin:0;font-family:monospace;">${otp}</p>
            </div>

            <!-- WARNING -->
            <div style="background:#f9fafb;border-radius:8px;padding:16px;display:flex;gap:10px;margin-bottom:24px;">
              <span style="font-size:18px;flex-shrink:0;">🛡️</span>
              <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
                If you did not request a password reset, please ignore this email. Your account remains secure.
              </p>
            </div>

            <!-- META -->
            <table width="100%" style="border-top:1px solid #e4e4e7;padding-top:16px;">
              <tr>
                <td style="font-size:12px;color:#9ca3af;padding:4px 0;">Expires in</td>
                <td style="font-size:12px;color:#9ca3af;text-align:right;padding:4px 0;">10 minutes</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#9ca3af;padding:4px 0;">Sent to</td>
                <td style="font-size:12px;color:#9ca3af;text-align:right;padding:4px 0;">${email}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e4e4e7;">
            <p style="font-size:12px;color:#9ca3af;margin:0;">© 2026 SmartEditor AI · All rights reserved</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const sendMail = async (to, subject, text) => {
    const otp = text.replace("Your OTP is ", "").trim();

    await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
            sender: { name: "SmartEditor AI", email: "raheemabdur106@gmail.com" },
            to: [{ email: to }],
            subject: subject,
            htmlContent: otpTemplate(otp, to),
        },
        {
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json",
            },
        }
    );

    console.log("MAIL SENT");
};

module.exports = sendMail;