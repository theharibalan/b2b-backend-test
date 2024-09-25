const { decodedEmail } = require("../encryption/decryptingEmailAndPassword");
const transporter = require("./transporter");


const formatIndianNumber = (num) => {
  const numStr = num.toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  if (otherNumbers !== "") {
    return `${otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`;
  } else {
    return lastThree;
  }
};

const sendMail = (email, name, price, quantity, productname, unitprice, invoiceUrl) => {
  const sendSalary = async (mailbody) => {
    try {
      const senderEmail = await decodedEmail();
      const transportor = await transporter();
      const info = await transportor.sendMail({
        from: senderEmail,
        to: email,
        subject: "Purchase Invoice and Payment Instructions for Your Recent Order",
        html: mailbody,
      });
      console.log("Mail sent for Purchase Invoice and Payment, ", email);
    } catch (error) {
      console.error("Error sending mail", error);
    }
  };
  const paylink = `https://vts-b2b.vercel.app/payments/${email}`


  const mailbody = `

<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Purchase Invoice and Payment Completion</title>
     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', Arial, sans-serif;
        background-color: #f0f0f5;
        margin: 0;
        padding: 0;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      .container {
        max-width: 800px;
        margin: 20px auto;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #28a745;
        color: #ffffff;
        padding: 20px;
        text-align: center;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 20px;
        color: #333333;
        font-size: 16px;
        line-height: 1.5;
      }
      .content p {
        margin: 0 0 10px;
      }
      .highlight-box {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-top: 10px;
      }
      .payment-summary {
        background-color: #e9f7ec;
        padding: 15px;
        border-radius: 5px;
        margin-top: 20px;
        border: 1px solid #28a745;
      }
      .order-details-table {
        width: 100%;
        border: 1px solid #ddd;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .order-details-table th,
      .order-details-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .order-details-table th {
        background-color: #28a745;
        color: #ffffff;
      }
      .footer {
        background-color: #28a745;
        color: #ffffff;
        padding: 10px;
        text-align: center;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
      }
      .footer p {
        margin: 0;
        font-size: 14px;
      }
      .link {
        color: #28a745;
        text-decoration: none;
      }
      .contact-info {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <table class="container">
      <tr>
        <td class="header">
          <h1>Purchase Invoice and Payment Completion</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p>Dear ${name},</p>
          <p>I hope this message finds you well.</p>
          <p>
            Attached, please find the purchase invoice for your recent order with us. You can also view and download the invoice using the following link:<br></br>
            <a href="${invoiceUrl}" class="link" target="_blank">View Invoice</a>.
          </p>
          <p>Kindly review the invoice details and proceed with the payment using the following bank account details:</p>
          <p class="highlight-box">
            <strong>Account Number:</strong> 3940002100057010<br />
            <strong>IFSC Code:</strong> PUNB03940000
          </p>
          <p class="payment-summary">
            <strong>Payment Summary</strong><br />
           Total Price: <strong> ₹ ${formatIndianNumber(parseInt(price))}</strong><br />
           GST (Exempted):  <strong>₹ 0</strong><br />
          Total Amount:  <strong> ₹ ${formatIndianNumber(parseInt(price))}</strong>
          </p>
          <p><strong>Order Details</strong></p>
          <table class="order-details-table">
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Price per Unit</th>
              <th>Total Price</th>
              <th>Notes</th>
            </tr>
            <tr>
              <td>${productname}</td>
              <td>${quantity}</td>
              <td>	₹ ${formatIndianNumber(unitprice)}</td>
              <td>	₹ ${formatIndianNumber(price)}</td>
              <td>The samples can be sent to the provided address on request</td>
            </tr>
            <!-- Additional rows can be added here as needed -->
          </table>
          <p>
            Once the payment has been completed, we kindly request you to upload your payment details using the following link:
            <a href="${paylink}" class="link" target="_blank">Upload Payment Details</a>. This will help us process your order smoothly and ensure timely delivery.
          </p>
          <p>For any queries or assistance, please feel free to contact us:</p>
          <p class="contact-info">
            <strong>Mobile:</strong> +91 7824036322<br />
            <strong>Email:</strong> <a href="mailto:support@b2bhubindia.com" class="link">support@b2bhubindia.com</a>
          </p>
          <p>Thank you for your business!</p>
          <p>Best regards,<br />B2BHub Support team<br />B2BHUB</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>© B2BHUB. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>

`
  sendSalary(mailbody);
};

module.exports = sendMail;
//sendMail('John Doe', 'johndoe@example.com', '$5000', '2024-08-21');
