require('dotenv').config(); // To load variables from .env
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_FROM;

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

const sendOrderMessage = async (customerId,customer_name, mobile_number, order_id, product_name, quantity, total_amount, invoice_link) => {
    const body = `
🔔 *ORDER CONFIRMATION* 🔔
=========================
Dear *${customer_name},*

Thank you for choosing us for your order. Below are the details of your purchase:

🆔 Order ID : *${order_id}*
📦 Product Name : *${product_name}*
⚖️ Quantity : *${quantity} TONNES*
💰 Total Amount : *₹ ${formatIndianNumber(parseInt(total_amount))}*
📤 [Upload Payment Details]* https://b2bhubindia.com/payments/${customerId}*

🔗 *[View Your Invoice]* ${invoice_link}

We appreciate your prompt payment. Once you’ve made the payment, please upload the payment details using the link provided:

One of our business associates will reach out to you shortly to assist with any further steps and to ensure everything is in order. 

At B2BHub, we are dedicated to facilitating smooth transactions and providing exceptional service. If you have any queries or require assistance, our team is here to support you.

Thank you for choosing B2BHub for your business needs.

Best regards,
B2Bhub Team
Contact : +91 7305096473
`

  client.messages
    .create({
      body: body,
      from: fromWhatsAppNumber,
      to: `whatsapp:91${mobile_number}`,
    })
    .then((message) => {
      console.log("Message sent successfully");
    })
    .catch((error) => {
      console.log(error);
      console.error('Twilio API error:', error);
    });
};

module.exports = sendOrderMessage;
