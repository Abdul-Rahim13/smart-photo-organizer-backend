const axios = require("axios");

const sendMail = async (to, subject, text) => {

    console.log("SENDING EMAIL TO:", to);

    const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
            sender: { name: "SmartEditor AI", email: "raheemabdur106@gmail.com" },
            to: [{ email: to }],
            subject: subject,
            textContent: text,
        },
        {
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json",
            },
        }
    );

    console.log("BREVO RESULT:", response.data);
};

module.exports = sendMail;