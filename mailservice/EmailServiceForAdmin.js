const { decodedEmail } = require("../encryption/decryptingEmailAndPassword");
const transporter = require("./transporter.js");


const sendEmail = async (name, email, loginDate, loginTime) => {
  try {

    const senderEmail = await decodedEmail();

    const transportor = await transporter();
    const mailbody = `
        <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Login Attempt</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        background-color: #f0f0f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
      }
      .header {
        background-color: #007bff;
        color: #ffffff;
        padding: 20px;
        text-align: center;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        margin: -20px -20px 20px -20px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        color: #333333;
        font-size: 16px;
        line-height: 1.5;
      }
      .content p {
        margin: 10px 0;
      }
      .footer {
        background-color: #007bff;
        color: #ffffff;
        padding: 10px;
        text-align: center;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        margin: 20px -20px -20px -20px;
      }
      .footer p {
        margin: 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Login Attempt</h1>
      </div>
      <div class="content">
        <p>Hello Admin,</p>
        <p>A new login attempt has been made on the platform with the following details:</p>
        <p><strong>User:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Date:</strong> ${loginDate}</p>
        <p><strong>Time:</strong> ${loginTime}</p>
        <p>Please review the login attempt if necessary. No further action is required unless this was unauthorized.</p>
      </div>
      <div class="footer">
        <p>© B2BHUB India All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`


    const mailOptions = {
      from: senderEmail,
      to: process.env.ADMIN_EMAIL,
      subject: "Admin login alert.",
      html: mailbody
    };

    await transportor.sendMail(mailOptions);
    console.log('Knowledgment Email sent to successfully, ', process.env.ADMIN_EMAIL);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



module.exports = sendEmail;
