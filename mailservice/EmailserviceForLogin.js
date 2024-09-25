const nodemailer = require('nodemailer');
const { decodedEmail, decodedPassword } = require("../encryption/decryptingEmailAndPassword");
const transporter = require("./transporter");

const sendEmail = async (name, email, otp) => {
  try {

    const senderEmail = await decodedEmail();

    const transportor = await transporter();
    // console.log("email......in the declaration, ", email);
    const mailbody = `
        <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login OTP</title>
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
        background-color: #28a745;
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
      .highlight-box {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-top: 10px;
        font-weight: 600;
        font-size: 18px;
        text-align: center;
        color: #28a745;
      }
      .footer {
        background-color: #28a745;
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
        <h1>Login Verification</h1>
      </div>
      <div class="content">
        <p>Dear ${name},</p>
        <p>We received a request to log in to your account associated with <strong>${email}</strong>.</p>
        <p>Please use the following One-Time Password (OTP) to complete your login:</p>
        <div class="highlight-box">
          <p>  ${otp}
        </div>
        <p>If you did not initiate this login request, please ignore this email.</p>
        <p>For any queries or assistance, please feel free to contact us.</p>
      </div>
      <div class="footer">
        <p>© B2BHUB India. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`


    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Requested otp for login.",
      html: mailbody
    };

    await transportor.sendMail(mailOptions);
    console.log('Otp for Login Email sent successfully, ',email );
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



module.exports = sendEmail;
