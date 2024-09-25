const cors = require('cors');
const bodyParser = require('body-parser');
//const {app, server} = require("./socket/socket.js")
const express = require("express");
const app = express();

require('dotenv').config();

const b2bRoutes = require("./Routes/b2bRoutes");
const finance = require("./Routes/FinanceRoutes");
const sales = require("./Routes/SalesRoutes");
const admin = require("./Routes/AdminRoutes");
const seller = require("./Routes/sellerRoutes.js");
const po = require("./Routes/PurchaseOrder.js");

const { encryptData, decryptData } = require("./encryption/encryption.js");
const sendMail = require('./mailservice/PaymentReceiptMail.js');
const sendOrderDetailsToBA = require("./WhatsappMessage/sendOrderDetails.js");

app.use(cors(["https://www.b2bhubindia.com/", "http://localhost:3000"]));
app.use(bodyParser.json({
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            console.error('Invalid JSON:', e.message);
            throw new Error('Invalid JSON');
        }
    }
}));

app.use((err, req, res, next) => {
    if (err.message === 'Invalid JSON') {
        return res.status(400).json({ error: 'Bad Request - Invalid JSON format' });
    }
    next(err);
});

app.get('/test', (req, res) => {
    res.send("hello hello hello");
});

app.post('/test-json', (req, res) => {
    res.send('JSON received successfully');
});

app.use('/b2b', b2bRoutes);
app.use('/finance', finance);
app.use('/admin', admin);
app.use('/sales', sales);
app.use("/seller", seller);
app.use("/po", po);

app.get('/sendmail', async (req, res) => {
    try {
        await sendMail("gantamohan.556@gmail.com", "B2B234567", "Mohan", 1575000, "MoongDal", 120, "https://maps.app.goo.gl/QFyWAL1SDEinEzth9", "X7G2+XQP, PTK nagar, Thiruvanmiyur, Chennai, Tamil Nadu 600041", "https://maps.app.goo.gl/QFyWAL1SDEinEzth9")
        res.send("Ok guru sent");
    } catch (err) {
        console.log(err);
        res.send("error maaya");
    }
});

app.get("/sendBA", async (req, res) => {
    try {
        await sendOrderDetailsToBA("companyname", "7075965619", "ORDID!@#$%^", "Dal", "209876543", "098765432", "http://localhost:3000");
        return res.status(200).send({ message: "Message sent successfully....." });
    } catch (error) {
        console.log("Error in the sendBA, ", error);
        return res.status(500).send({ error: "Internal server error......." });
    }
});

app.listen(5000, async () => {
    console.log("Server running on port 5000");
    //encrypt your data here
    // const encoded = await encryptData(process.env.EMAIL_PASS);
    // console.log(encoded);
    // const decoded = await decryptData(encoded);
    // console.log(decoded);
});
