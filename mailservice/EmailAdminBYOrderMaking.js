const nodemailer = require('nodemailer');
const { decodedEmail } = require("../encryption/decryptingEmailAndPassword");
const transporter = require("./transporter.js");

const sendProductRequestEmail = async (sellerName, sellerEmail, productName, quantity, price) => {
  try {
    const transportor = await transporter();
    const senderEmail = await decodedEmail();
    
    const mailbody = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Product Request</title>
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
      .product-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .product-table th, .product-table td {
        border: 1px solid #dddddd;
        padding: 8px;
        text-align: left;
      }
      .product-table th {
        background-color: #f0f0f5;
        font-weight: 600;
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
        <h1>Request for Product</h1>
      </div>
      <div class="content">
        <p>Hello ${sellerName},</p>
        <p>We would like to request the following product from your inventory:</p>

        <table class="product-table">
          <tr>
            <th>Product Name</th>
            <td>${productName}</td>
          </tr>
          <tr>
            <th>Requested Quantity</th>
            <td>${quantity}</td>
          </tr>
          <tr>
            <th>Estimated Price</th>
            <td>${price}</td>
          </tr>
        </table>

        <p>Please confirm the availability of the product and provide the delivery details. We are also eager to discuss the payment terms at your earliest convenience.</p>
        <p>Thank you for your attention and cooperation.</p>
      </div>
      <div class="footer">
        <p>© B2BHUB India. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;

    const mailOptions = {
      from: senderEmail,
      to: sellerEmail,
      subject: `Request for ${productName} - Quantity: ${quantity}`,
      html: mailbody
    };
    
    const response = await transportor.sendMail(mailOptions);
    console.log('Product request email sent successfully---------', sellerEmail);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendProductRequestEmail;
