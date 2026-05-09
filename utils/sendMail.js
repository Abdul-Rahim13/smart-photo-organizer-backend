const Brevo = require("@getbrevo/brevo");

const client = Brevo.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

const sendMail = async (to, subject, text) => {
    const email = new Brevo.SendSmtpEmail();
    email.sender = { name: "SmartEditor AI", email: "raheemabdur106@gmail.com" };
    email.to = [{ email: to }];
    email.subject = subject;
    email.textContent = text;

    const result = await apiInstance.sendTransacEmail(email);
    console.log("BREVO RESULT:", result);
};

module.exports = sendMail;