const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
});

transporter.verify((error) => {
    if (error) console.log("MAIL ERROR:", error);
    else console.log("MAIL SERVER READY");
});

const sendMail = async (to, subject, text) => {
    await transporter.sendMail({
        from: `"SmartEditor AI" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
};

module.exports = sendMail;