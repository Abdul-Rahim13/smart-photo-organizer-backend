const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, text) => {

    console.log("RESEND KEY:", process.env.RESEND_API_KEY ? "EXISTS" : "MISSING");

    const result = await resend.emails.send({
        from: "SmartEditor AI <onboarding@resend.dev>",
        to,
        subject,
        text,
    });

    console.log("RESEND RESULT:", JSON.stringify(result));
};

module.exports = sendMail;