const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// DEBUG
transporter.verify(function (error, success) {
    if (error) {
        console.log("MAIL ERROR:", error);
    } else {
        console.log("MAIL SERVER READY");
    }
});

const sendMail = async (to, subject, text) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
    });
};

module.exports = sendMail;