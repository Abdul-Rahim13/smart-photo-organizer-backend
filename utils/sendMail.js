const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, text) => {
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject,
        text,
    });
};

module.exports = sendMail;