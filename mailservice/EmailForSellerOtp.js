const nodemailer = require('nodemailer');
const {decodedEmail} = require("../encryption/decryptingEmailAndPassword");
const transporter = require("./transporter.js");

const sendEmail = async (name, email, otp) => {
  try {
    const transportor = await transporter();
    const senderEmail = await decodedEmail();
    const mailbody = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>OTP for Seller Login Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            width: 100%;
            background-color: #ffffff;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #dddddd;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #FF5722;
            padding: 10px;
            text-align: center;
            color: #ffffff;
            font-size: 24px;
            border-radius: 5px 5px 0 0;
        }

        .content {
            padding: 20px;
            font-size: 16px;
            color: #333333;
            line-height: 1.6;
        }

        .otp-code {
            font-size: 20px;
            color: #FF5722;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            margin: 20px 0;
            background-color: #f9f9f9;
            border-radius: 5px;
        }

        .footer {
            text-align: center;
            font-size: 14px;
            color: #999999;
            margin-top: 20px;
        }

        .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #FF5722;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }

        /* Media Query for Mobile View */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100%;
                padding: 10px; /* Reduce padding for mobile */
            }

            .header {
                font-size: 20px; /* Adjust header font size */
                padding: 8px;
            }

            .content {
                padding: 10px;
                font-size: 14px; /* Adjust font size for content */
            }

            .otp-code {
                font-size: 18px; /* Adjust OTP font size */
                padding: 8px;
            }

            .footer {
                font-size: 12px; /* Smaller footer text */
                margin-top: 10px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            Seller Login Request OTP
        </div>
        <div class="content">
            <p>Dear ${name}</p>
            <p>We have received your request to log in as a seller. Please use the OTP code below to complete your login process.</p>

            <div class="otp-code">${otp}</div>

            <p>If you did not make this request, please ignore this email or contact our support team.</p>

            <p>Best regards,</p>
            <p>Your Company Team</p>
        </div>
        <div class="footer">
            &copy; B2BHUB. All rights reserved.
        </div>
    </div>
</body>

</html>`


    const mailOptions = {
      from: senderEmail,
      to: email,
      subject: "Requested otp for reset password.",
      html: mailbody
    };
    await transportor.sendMail(mailOptions);
    console.log('Otp Email sent successfully for seller login, :', email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



module.exports = sendEmail;
