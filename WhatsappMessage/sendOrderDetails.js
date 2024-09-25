require('dotenv').config(); 
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

const sendOrderMessage = async (customer_name, mobile_number, order_id, product_name, quantity, total_amount, invoice_link) => {
  const body = `
🔔 *NEW ORDER RECEIVED* 🔔
=========================
📌 *Manage Orders:* [Click Link] 
https://b2bhubindia.com/admin

📋 *Order Details:*

👤 Customer Name: *${customer_name}*
📞 Customer Phone: *${mobile_number}*
🆔 Order ID : *${order_id}* 
📦 Product Name : *${product_name}*
⚖️ Quantity : *${quantity} TONNES*
💰 Order Price : *₹ ${formatIndianNumber(parseInt(total_amount))}*

🔗 *[View Invoice]* ${invoice_link}

`;

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
