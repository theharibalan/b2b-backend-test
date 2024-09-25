const express = require("express");
const router = express.Router();
const connection = require("../database");
const xlsx = require('xlsx');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Queries = require("../SQL/Queries/Queries.json");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateTokenAndSetCookie = require("../utils/generateAndSetCookie.js");
const GenerateOpt = require("../service/GenerateOtp.js");
const SendEmail = require("../mailservice/EmailService.js");
const middleware = require("../middlewares/Middleware.js");
const sendEmailSellerLogin = require("../mailservice/EmailForSellerOtp.js");
const {protectRouteForBoth} = require("../middlewares/AdminMiddleware.js");

//---/b2b

// customer registeration


router.post("/verifyCustomerToken", middleware, async( req, res ) => {
    try {
        return res.status(200).send({message: "Token is not expired."});
    } catch (error) {
        console.log("error in the verifyAdminToken, ", error);
        return res.send({error: "Internal server error...."});
    }
})

router.post('/customer-registration', async (req, res) => {
    try {
        await connection.query(Queries.customerQueries.createCustomerTable);
        const { CompanyName, PAN, gstNo, Email, Password, phoneNo } = req.body;

        // Check for duplicate entries by Email, PAN, or gstNo
        const [existingCustomer] = await connection.query(
            `SELECT * FROM Customer WHERE Email = ? OR PAN = ? OR gstNo = ?`,
            [Email, PAN, gstNo]
        );

        if (existingCustomer.length > 0) {
            // If a customer with the same Email, PAN, or gstNo already exists, return an error
            return res.status(409).json({ message: "Customer with this Email, PAN, or GST Number already exists" });
        }

        // Function to get the current date without time
        function getCurrentDateWithoutTime() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(Password, salt);

        // Insert the new customer
        await connection.query(Queries.customerQueries.insertCustomer, [
            CompanyName, PAN, gstNo, Email, hashPassword, phoneNo, getCurrentDateWithoutTime()
        ]);

        // Retrieve the customerId of the newly created customer
        const [customerId] = await connection.query(`SELECT customerId FROM Customer WHERE PAN = ?`, [PAN]);

        console.log(customerId);
        
        // Generate token and set the cookie
        const token = await generateTokenAndSetCookie(Email);

        // Send success response
        return res.send({ message: "Customer created successfully", customerId: customerId[0].customerId,  token: token });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "User creation failed", error: err });
    }
});




// bulk customer registerations

router.post('/cusReg', upload.single('file'), async (req, res) => {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const customers = xlsx.utils.sheet_to_json(worksheet);

    try {
        await connection.query(Queries.customerQueries.createCustomerTable);

        for (const customer of customers) {
            let {
                CompanyName, PAN, gstNo, Email, Password, phoneNo, TelephoneNo, address1, address2, state, city, landmark, pinCode, DateOfReg
            } = customer;

            await connection.query(Queries.customerQueries.insertCustomer, [

                CompanyName, PAN, gstNo, Email, Password, phoneNo, TelephoneNo, address1, address2, state, city, landmark, pinCode, DateOfReg
            ])

            console.log(`Customer ${customer.CompanyName} added successfully`);
        }

        res.send({ message: "Customers added successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: "An error occurred while adding customers" });
    }
});


// login 

router.post('/login', async (req, res) => {
    try {
        const { email, pwd, isSeller } = req.body;
        if(!email || !pwd)
        {
            return res.status(400).send({error: "Email and Password are required......"});
        }
        const [user] = await connection.query(Queries.customerQueries.getCustomerByEmail, [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: "Invalid Credentials" });
        }

        // Check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(pwd, user[0].Password || "");
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        if( !user[0].isSeller && isSeller )
        {
            return res.status(403).send({error: "You donot have any access to seller portal."})
        }

        const token = await generateTokenAndSetCookie(email);

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                customerId: user[0].customerId, CompanyName: user[0].CompanyName, PAN: user[0].PAN, gstNo: user[0].gstNo, Email: user[0].Email,
                phoneNo: user[0].phoneNo, DateOfReg: user[0].DateOfReg
            }
        });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "Some error occurred", error: err.message });
    }
});


//Request to upgrade as seller


router.post("/reqToUpgradeSeller", async( req, res ) => {
    try {
        const {email} = req.body;
        let otp = await GenerateOpt();
        const [user] = await connection.query(Queries.customerQueries.getCustomerByEmail, [email]);
        if(user.affectedRows === 0 )
        {
            return res.status(404).send({error: "User not found."});
        }
        if(user[0].isSeller === 1)
        {
            return res.status(409).send({error: "Already register as seller..."});
        }

        const [userotp] = await connection.query(Queries.customerQueries.insertOtp, [otp, email]);
        if (userotp.length === 0) {
            return res.status(400).send({ error: "Failed to send the otp." });
        }
        await sendEmailSellerLogin( user[0].CompanyName, email, otp);
        return res.status(200).send({message: "Otp is sent successfully."});
    } catch (error) {
        console.log("error in the reqToUpgradeSeller, ", error);
        return res.status(500).send({error: "Internal server error..."});
    }
})


// upgrade to seller by passing the email and otp 


router.put("/upgradeToSeller", async(req, res) => {
    try {
        const {email, otp} = req.body;
        if(!email || !otp)
        {
            return res.status(400).send({error: "All the fields are required."});
        }
        const [result] = await connection.query(Queries.customerQueries.updateToSeller, [email, otp]);
        if(result.affectedRows === 0)
        {
            return res.status(400).send({error: "Invalid otp."});
        }
        await connection.query(Queries.customerQueries.insertOtp, [null, email]);
        const token = await generateTokenAndSetCookie(email);

        res.status(200).json({
            message: 'Login successful',
            token: token
        });
    } catch (error) {
        console.log("error in the upgradeToSeller, ", error);
        return res.status(500).send({error: "Internal server error..."});
    }
})


//  subscribe to platinum or gold


router.put("/subcribe", middleware, async( req, res ) => {
    try {
        const { category, location } = req.body;
        const customerId = req.user;
        if( !category || !location )
        {
            return res.status(400).send({error: "All the fields are required."});
        }
        let subcription = "GOLD"
        if( category === "PLATINUM" )
        {
            subcription = "PLATINUM"
        }
        const [result] = await connection.query(Queries.customerQueries.upgradePremium, [ subcription, location, customerId ]);
        if(result.affectedRows === 0)
        {
            return res.status(400).send({error: "Failed to update the Details..."});
        }

        return res.status(200).send({message: `Your are subscribed to ${category}`});
    } catch (error) {
        console.log("error in the upgradeToSeller, ", error);
        return res.status(500).send({error: "Internal error server..."});
    }
})


// requesting the otp for reset password


router.post("/sendOtp", async (req, res) => {
    try {
        const { email } = req.body;
        const [user] = await connection.query(Queries.customerQueries.getCustomerByEmail, [email]);
        if (user.length === 0) {
            res.status(404).json({ message: "Email is not found..." });
            return;
        }
        let otp = await GenerateOpt();
        const [userotp] = await connection.query(Queries.customerQueries.insertOtp, [otp, email]);
        if (userotp.length === 0) {
            return res.status(400).send({ error: "Failed to send the otp." });
        }
        await SendEmail(user[0].CompanyName, email, otp);
        return res.status(200).send({ message: "You requested otp have sent to your email id."});

    } catch (error) {
        console.log("error in the forgot, ", error);
        return res.status(500).send({ error: "Internal server error..." });
    }
})


// verify the email and otp then after reset the password


router.put('/resetpassword', async (req, res) => {
    try {
        const { email, password, confirmPassword, otp } = req.body;
        if (!email || !password || !confirmPassword || !otp) {
            return res.status(400).send({ error: "All fields are required..." });
        }
        if (confirmPassword !== password) {
            return res.status(400).send({ error: "Password and confirm Password fields are not matching...." });
        }
        
        const [user] = await connection.query(Queries.customerQueries.getOtp, [email]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log("otp: ", user[0]);
        
        if(user[0].otp !== otp)
        {
            return res.status(400).send({error: "Invalid otp...."});
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        await connection.query(Queries.customerQueries.updatePassword, [hashPassword, email]);
        res.status(200).json({ message: 'Password reset successful. Check your email for the new password.' });
    } catch (err) {
        console.log("error in the resetpassword, ", err);
        res.status(500).json({ message: err.message });
    }
});


// get user details by customerId


router.post('/getUser/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [user] = await connection.query(Queries.customerQueries.getCustomerById, [id]);
        if (user.length > 0) {
            res.send(user[0]);
        } else {
            res.status(404).send({ message: "User not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
    }
});



// Get All the orders for admin



router.post("/getorders", protectRouteForBoth, async (req, res) => {
    try {
        const query = `SELECT * FROM orderDetails`;
        const result = await connection.query(query);
        return res.status(200).send(result[0]);
    } catch (error) {
        console.log("Error in the getorders ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        })
    }
});


// get orders


router.get("/getorderss", async(eq, res) => {
    try {
        const query = `SELECT * FROM orderDetails`;
        const result = await connection.query(query);
        return res.status(200).send(result[0]);
    } catch (error) {
        console.log("error in the getorders, ", error);
        return res.status(500).send({error: "Internal server error"});
    }
})


// get all the sellers


router.post("/getAllSellers", protectRouteForBoth,  async( req, res ) => {
    try {
        const [result] = await connection.query(Queries.customerQueries.getAllSellers);
        return res.status(200).send(result);
    } catch (error) {
        console.log("Error in the getorders ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
})


// get orders by customerId


router.post("/getorder/:orderId", async (req, res) => {
    try {
        const order_id = req.params.orderId;
        const query = `SELECT * FROM orderDetails WHERE orderId = ?`;
        const result = await connection.query(query, [order_id]);
        return res.status(200).send(result[0]);
    } catch (error) {
        console.log("Error in the getorders ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        })
    }
});


// add the transaction details 


router.post('/addtransaction/:orderid', middleware, async (req, res) => {
    try {
        await connection.query(Queries.transactionQueries.createTransactionTable);
        const { orderid } = req.params;
        const OrderId = orderid;
        const { transactionId,
            transactionDate, accountId, amount } = req.body;

        const transactionType = 'Credit';

        const invoiceNo = await connection.query('SELECT invoiceId FROM Invoices WHERE orderId = ?', [OrderId])
        console.log(invoiceNo);
        await connection.query(Queries.transactionQueries.insertTransactions, [OrderId, accountId, transactionId, transactionDate, transactionType, invoiceNo[0][0].invoiceId, amount]);
        const update = `UPDATE orderDetails SET payment_status = 1 WHERE orderId = ?`
        await connection.query(update, [OrderId]);
        res.send({ message: "updated" });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Internal server error" });
    }
});


module.exports = router;