const express = require('express')
const router = express.Router()
const Queries = require('../SQL/Queries/Queries.json')
const connection = require('../database')
const sendinvoiceMail = require('../mailservice/sendMail')
const sendOrderDetailsToBA = require('../WhatsappMessage/sendOrderDetails')
const sendOrderDetailsToCustomer = require('../WhatsappMessage/sendOrderDetailsToCustomer')
const middleware = require("../middlewares/Middleware")
const {protectRouteForBoth} = require("../middlewares/AdminMiddleware.js");

router.post('/allCustomers', async (req, res) => {
    try{
        const query = "SELECT * FROM Customer";
        const result = await connection.query(query);
        return res.status(200).send(result[0]);
    }catch(error){
        console.log("Error in the getcustomers ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        })
    }
});


router.post('/customers', async (req, res) => {
    try {
        const query = Queries.customerQueries.getCustomers;
        const [results] = await connection.query(query);
        return res.status(200).send(results);
    } catch (err) {
        console.log("Error in the getcustomers ", err);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});



router.post('/getInoivceId', async(req, res)=>{
    await connection.query(" INSERT INTO Invoices(invoiceId) SELECT CONCAT('B2BINV', LPAD(COALESCE(MAX(CAST(SUBSTRING(invoiceId, 7) AS UNSIGNED)) + 1, 1), 5, '0'))FROM Invoices ")
    const invoiceId = await connection.query("SELECT invoiceId FROM Invoices ORDER BY invoiceId DESC LIMIT 1")
    res.send(invoiceId[0])
})


router.post('/addorder', middleware, async (req, res) => {
    try {
        await connection.query(Queries.orderQueries.createOrderTable);
        const {
            invoiceId,companyname,phone_no, address1, address2, city, state, email, landmark, zip_code, gst_no, requested_sample,
            product_name, product_quantity, product_type, total_amount,invoiceUrl
        } = req.body;
        console.log(req.body)
        const customerId = req.user;
        const [product] = await connection.query("SELECT * FROM Product WHERE name = ?", [product_name]);
        function getCurrentDateWithoutTime() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        }
        // customerId, CompanyName, gst_no, productId, product_name, product_quantity, product_type, dateOfOrder, totalAmount,email,phoneNo,address1,address2,city, state,landmark,pinCode,requestedSample, invoiceLink
        await connection.query(Queries.orderQueries.insertOrder, [
            customerId,companyname,gst_no,product[0].productId,product_name,product_quantity,product_type,getCurrentDateWithoutTime(),total_amount,email,phone_no,address1,address2,city,state,landmark,zip_code,requested_sample,invoiceUrl
        ])  
        const oid = await connection.query(`SELECT orderId FROM orderDetails order by orderId DESC LIMIT 1`)
        const updateQuery = `UPDATE Invoices SET customerId = ?, orderId = ?, invoiceUrl = ?, invoiceDate = date_format(current_date(), '%d/%m/%Y') WHERE invoiceId = ?;`
        console.log(invoiceUrl , invoiceId)
        await connection.query(updateQuery,[customerId,oid[0][0].orderId,invoiceUrl,invoiceId]);
        await connection.query(Queries.AdminTracker.insert, [])
        // email, name, price, quantity, productname, unitprice, invoiceUrl
        await sendinvoiceMail(email,customerId, oid[0][0].orderId, companyname,total_amount,product_quantity,product_name,total_amount/product_quantity,invoiceUrl)
        await sendOrderDetailsToBA(companyname, "7305096473", oid[0][0].orderId, product_type, product_quantity, total_amount, invoiceUrl)
        await sendOrderDetailsToCustomer(customerId,companyname, phone_no, oid[0][0].orderId, product_type, product_quantity, total_amount, invoiceUrl)
        res.send({ message: "Order created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Order creation failed", error: err });
    }
});
router.post('/viewOrders', middleware, async (req, res) => {
    try {
        const customerId = req.user;
        const query = Queries.orderQueries.getCustomerOrders;
        const [results] = await connection.query(query, [customerId]);
        return res.status(200).send(results);
    } catch (err) {
        console.log("Error in the getcustomers ", err);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});

router.post('/updateorderstatus/:orderid', protectRouteForBoth, async(req,res)=>{
    try{
        const orderId = req.params.orderid
        await connection.query(Queries.orderQueries.updateOrderStatus,[orderId])
        res.status(200).send({message:"Order status updated successfully"})
    }
    catch(err)
    {
        console.log(err)
        res.status(500).send(err)
    }
})


router.post('/stateSales', async (req, res) => {
    try {
        const query = Queries.orderQueries.getStateSales;
        const [results] = await connection.query(query);
        return res.status(200).send(results);
    } catch (err) {
        console.log("Error in the get customers ", err);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});


router.post('/clients', async (req, res)=>{
    try{
        const NumOfClients = await connection.query(Queries.customerQueries.getTotalCustomers)
        res.send(NumOfClients[0][0])
    }
    catch(err){
        console.log(err)
        res.send('Some error occured')
    }
})

router.post('/salesCount', async(req, res)=>{ 
    try{
        const NumOfSales = await connection.query(Queries.orderQueries.getSales)
        res.send(NumOfSales[0][0]);
    }
    catch(err){
        console.log(err)
        res.send('Some error occured')
    }
})

router.post('/invoices', async(req, res)=>{
    try{
        const Invoices = await connection.query(Queries.invoiceQueries.getAllInvoices)
        res.send(Invoices[0])
    }
    catch(err){
        console.log(err) 
        res.send('Some error occured')  
    }
})

router.post('/shipments', async(req, res)=>{
    try{
        const shipments = await connection.query(Queries.shipmentQueries.getShipmentTables)
        res.send(shipments[0])
    }
    catch(err){
        console.log(err)
        res.send('Some error occured')
    }
})



module.exports = router;
