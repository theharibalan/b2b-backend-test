const express = require("express");
const router = express.Router();
const connection = require("../database");
const xlsx = require('xlsx');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Queries = require("../SQL/Queries/Queries.json");
const receiptMail = require('../mailservice/PaymentReceiptMail')
const {protectRouteForBoth} = require("../middlewares/AdminMiddleware.js");


router.post('/customerreg', async (req, res) => {
    try {
        await connection.query(Queries.customerQueries.createCustomerTable);

        const CompanyName = req.body.CompanyName || '';
        const PAN = req.body.PAN || null;
        const gstNo = req.body.gstNo || null;
        const Email = req.body.Email || null;
        const Password = req.body.Password || null;
        const phoneNo = req.body.phoneNo || '';
        const TelephoneNo = req.body.TelephoneNo || null;
        const address1 = req.body.address1 || null;
        const address2 = req.body.address2 || null;
        const state = req.body.state || null;
        const city = req.body.city || null;
        const landmark = req.body.landmark || null;
        const pinCode = req.body.pinCode || null;
        const DateOfReg = getCurrentDateWithoutTime();

        function getCurrentDateWithoutTime() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        }

        await connection.query(Queries.customerQueries.insertCustomer, [
            CompanyName, PAN, gstNo, Email, Password, phoneNo, TelephoneNo, address1, address2, state, city, landmark, pinCode, DateOfReg
        ]);

        res.send({ message: "Customer created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "User creation failed", error: err });
    }
});


router.post('/customer-bulk-registration', upload.single('file'), async (req, res) => {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const customers = xlsx.utils.sheet_to_json(worksheet);

    try {
        await connection.query(Queries.customerQueries.createCustomerTable);
        for (const customer of customers) {

            let {
                CompanyName, PAN, gstNo, Email, phoneNo
            } = customer;
            console.log(customer)
            await connection.query(Queries.customerQueries.insertExcel, [

                CompanyName, PAN, gstNo, Email, PAN, phoneNo
            ])
        }

        res.send({ message: "Customers added successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "An error occurred while adding customers" });
    }
});



router.get('/allCustomers', async (req, res) => {
    try {
        const query = "SELECT * FROM Customer";
        const result = await connection.query(query);
        return res.status(200).send(result[0]);
    } catch (error) {
        console.log("Error in the getcustomers ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        })
    }
});


router.get('/getPaymentReceiptId', protectRouteForBoth,  async (req, res) => {
    await connection.query(" INSERT INTO paymentReceipt(paymentRId) SELECT CONCAT('PID', LPAD(COALESCE(MAX(CAST(SUBSTRING(paymentRId, 4) AS UNSIGNED)) + 1, 1), 5, '0'))FROM  paymentReceipt")
    const payRId = await connection.query("SELECT paymentRId FROM paymentReceipt ORDER BY paymentRId DESC LIMIT 1")
    console.log(payRId[0][0])
    res.send(payRId[0][0].paymentRId)
})
function getCurrentDateWithoutTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}
router.post("/approve-payment", protectRouteForBoth, async (req, res) => {
    try{
        const { pid,
            order_id,
            email,
            name,
            receipt_url,
            amount,
            quantity,
            product_name ,
            warehouseLocation,
            warehouseURL} = req.body
    
            const approvalQuery  = `UPDATE orderDetails SET payment_verified = 1, paymentUrl = ? WHERE orderId = ?`
            await connection.query(approvalQuery,[receipt_url,order_id])
            const updateTNXQuery = `UPDATE paymentReceipt SET  paymentLink = ?,paymentDate = ?,invoiceId=(SELECT invoiceId FROM Invoices WHERE orderId = ?) , orderId=? WHERE paymentRId = ?`
            await connection.query(updateTNXQuery,[receipt_url,getCurrentDateWithoutTime(), order_id,order_id ,pid])
            await receiptMail(email,order_id,name,amount,product_name,quantity,receipt_url,warehouseLocation,warehouseURL)
            res.status(200).send("Approved Successfully")
    }
    catch(err){
        console.log(err)
        res.status(500).send("Error")
    }
})

router.get('/getTransaction/:orderId', protectRouteForBoth, async (req,res)=>{
    const orderId = req.params.orderId
    const transaction = await connection.query(Queries.transactionQueries.getTransactionByOrderId,[orderId])
    res.send(transaction[0][0])
})
router.get('/getAllTransactions', async (req, res) => {
    try {
        const query = Queries.transactionQueries.getAllTransactions;
        const [results] = await connection.query(query);
        return res.status(200).send(results);
    } catch (error) {
        console.log("Error in the get all Transactions:", error);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});

router.get('/allTransactions',async (req,res)=>{
    try{
        const [result] = await connection.query(`SELECT * FROM Transactions`)
        res.status(200).send(result);
    }
    catch(err){
        console.log(err)
        res.status(500).send(err)
    }
})


module.exports = router

