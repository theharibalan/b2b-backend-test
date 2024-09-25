const { decodedEmail } = require("../encryption/decryptingEmailAndPassword");
const transporter = require("./transporter");

function formatIndianNumber(number) {
  const numStr = number.toString();
  let lastThreeDigits = numStr.slice(-3);
  const otherDigits = numStr.slice(0, -3);

  if (otherDigits !== '') {
    lastThreeDigits = ',' + lastThreeDigits;
  }

  const formattedNumber = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThreeDigits;
  return formattedNumber;
}

const sendPaymentReceipt = (email, orderid, name, amountPaid, productName, quantity, receipturl, address, mapLink) => {
  console.log(receipturl);
  
  const sendMail = async (mailbody) => {
    try {
      const senderEmail = await decodedEmail();
      const transportor = await transporter();
      const info = await transportor.sendMail({
        from: senderEmail,
        to: email,
        subject: "Payment Receipt and Dispatch Information for Your Recent Purchase",
        html: mailbody,
      });
      console.log("PaymentReceipt Mail sent, ",email );
    } catch (error) {
      console.error("Error sending mail", error);
    }
  };

  const mailbody = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Receipt</title>
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
        background-color: #007bff;
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
      .highlight-box {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-top: 10px;
      }
      .payment-summary {
        background-color: #e9f7ff;
        padding: 15px;
        border-radius: 5px;
        margin-top: 20px;
        border: 1px solid #007bff;
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
        background-color: #007bff;
        color: #ffffff;
      }
      .footer {
        background-color: #007bff;
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
        color: white;
        text-decoration: none;
      }
      .contact-info {
        background-color: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
      }
      .highlighted-address {
        background-color: #e9f7ff;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #007bff;
        font-weight: bold;
        display: flex;
        align-items: center;
      }
      .highlighted-address-icon {
        margin-right: 10px;
        font-size: 18px;
        color: #007bff;
      }
      iframe {
        margin-top: 10px;
        width: 100%;
        height: 300px;
        border: 0;
        border-radius: 5px;
      }
      /* Button styling */
      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        text-align: center;
        font-weight: bold;
      }
      /* Center align the button */
      .button-container {
        text-align: center;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <table class="container">
      <tr>
        <td class="header">
          <h1>Payment Receipt & Dispatch Information</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          <p>Dear ${name},</p>
          <p>Thank you for your recent purchase! We have received your payment for order <strong>ID ${orderid}</strong>, and it has been verified successfully.</p>
          <p>Your order is ready for dispatch! You can collect it from the following address:</p>
          
          <p>
          <a href="${mapLink}" target="_blank" title="Click this image to view the location on the map">
            <img src="https://res.cloudinary.com/dvmkt80vc/image/upload/v1725562298/maps_Image_tqfxu0.webp" alt="Map Location" style="width:100%; max-width:600px; height:auto;">
          </a>
        </p>
          <!-- Highlighted address section with icon -->
          <div class="highlighted-address">
            <span class="highlighted-address-icon">📍</span>
            ${address}
          </div>

        
        <p>Clicking the image above will navigate you to the location on the map.</p>
          
          <!-- Centered button for viewing the payment receipt -->
          <div class="button-container">
            <a href="${receipturl}" class="button" target="_blank">View Payment Receipt</a>
          </div>
          
          <p class="payment-summary">
            <strong>Payment Summary</strong><br />
            <strong>Amount Paid:</strong> ₹ ${formatIndianNumber(parseInt(amountPaid))}<br />
            <strong>Order ID:</strong> ${orderid}
          </p>
          <p><strong>Order Details</strong></p>
          <table class="order-details-table">
            <tr>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Total Paid</th>
            </tr>
            <tr>
              <td>${productName}</td>
              <td>${quantity} TONNES</td>
              <td>₹ ${formatIndianNumber(parseInt(amountPaid))}</td>
            </tr>
          </table>
          <p>If you have any questions or need further assistance, please feel free to contact us:</p>
          <p class="contact-info">
            <strong>Mobile:</strong> +91 7824036322<br />
            <strong>Email:</strong> <a href="mailto:support@b2bhubindia.com" class="link">support@b2bhubindia.com</a>
          </p>
          <p>Thank you for choosing our B2B services!</p>
          <p>Best regards,<br />B2BHub Support Team</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>© B2BHUB India. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>


  `;

  sendMail(mailbody);
};

module.exports = sendPaymentReceipt;

