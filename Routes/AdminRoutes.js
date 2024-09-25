const express = require("express");
const router = express.Router();
const connection = require("../database");
const Queries = require("../SQL/Queries/Queries.json");
const AdminQueries = require("../SQL/Queries/Queries.json");
const generateAndSetCookie = require("../utils/generateAndSetCookie.js");
const bcrypt = require("bcrypt");
const {protectRouteForBoth} = require("../middlewares/AdminMiddleware.js");
const GenerateOpt = require("../service/GenerateOtp.js");
const sendOtp = require("../mailservice/EmailserviceForLogin.js");
const mailForAdmin = require("../mailservice/EmailServiceForAdmin.js");



const getDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

const getTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}


router.post("/verifyAdminToken", protectRouteForBoth, async (req, res) => {
    try {
        return res.status(200).send({ message: "Token is not expired." });
    } catch (error) {
        console.log("error in the verifyAdminToken, ", error);
        return res.send({ error: "Internal server error...." });
    }
})

router.post("/adminRegister", protectRouteForBoth, async (req, res) => {
    try {
        const { name, email, password, confirmPassword, empId, role } = req.body;
        if (!name || !email || !password || !confirmPassword || !empId || !role) {
            return res.status(400).send({ error: "All the fields are required...." });
        }
        if (password !== confirmPassword) {
            return res.status(400).send({ error: "Password and confirm passsword are not matched..." });
        }
        const [existingUser] = await connection.query(AdminQueries.adminQueries.getAdmin, [email]);
        if (existingUser.length !== 0) {
            return res.status(400).send({ error: "User already existing........." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        await connection.query(AdminQueries.adminQueries.insertAdmin, [name, email, hashPassword, empId, role]);
        const date = new Date();
        const time = getTime(date);
        const formatDate = getDate(date);
        await mailForAdmin(name, email, formatDate, time);
        return res.status(201).send({ message: "Admin registered successfully....", login: true });

    } catch (error) {
        console.log("error in the adminRegister, ", error);
        return res.status(500).send({ error: "Internal server error...." });
    }
})

router.post("/adminLoginRequest", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).send({ error: "Email is required...." });
        }
        const [user] = await connection.query(AdminQueries.adminQueries.getAdmin, [email]);
        if (user.length === 0) {
            return res.status(404).send({ error: "User not found...." });
        }

        const otp = await GenerateOpt();
        await connection.query(Queries.adminQueries.updateOtp, [otp, email]);
        await sendOtp(user[0].name, email, otp);
        res.status(200).json({
            message: 'Otp sent successfully.',
        });

    } catch (error) {
        console.log("error in the adminLogin, ", error);
        return res.status(500).send({ error: "Internal server error...." });
    }
});


router.post("/adminLoginVerify", async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        
        // Check if all fields are present
        if (!email || !password || !otp) {
            return res.status(400).send({ error: "All the fields are required." });
        }

        // Fetch user from the database
        const [rows] = await connection.query(AdminQueries.adminQueries.getAdmin, [email]);
        if (rows.length === 0) {
            return res.status(404).send({ error: "User not found." });
        }
        
        const user = rows[0];

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, user.password || "");
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: "Invalid password or OTP." });
        }

        // Verify OTP
        if (user.otp !== otp) {
            return res.status(401).json({ error: "Invalid password or OTP." });
        }

        console.log("---------------", user);

        // Clear OTP after successful login
        await connection.query(AdminQueries.adminQueries.updateOtp, [null, email]);

        // Generate token and set cookie
        const token = await generateAndSetCookie(email);
        
        return res.status(200).json({
            message: 'Login successful',
            login: true,
            token: token,
            empId: user.empId,
            role: user.role
        });

    } catch (error) {
        console.log("Error in the adminLoginVerify: ", error);
        return res.status(500).send({ error: "Internal server error." });
    }
});



// router.post("/adminLogout",protectRouteForBoth, async (req, res) => {
//     try {
//         const email = req.user;
//         const [user] = await connection.query(AdminQueries.adminQueries.updateAdminLogout, [email]);        
//         res.cookie("jwt", "", { maxAge: 0 });
//         return res.status(200).json({ message: "Logged out successfully" });
//     } catch (error) {
//         console.log("error in the adminLogout, ", error);
//         return res.status(500).send({ error: "Internal server error...." });
//     }
// });

router.put('/payVerify/:OrderId', protectRouteForBoth, async (req, res) => {
    try {
        const OrderId = req.params.OrderId;
        const PaymentVerified = req.body.PaymentVerified;
        await connection.query(Queries.transactionQueries.getTransactionTable, [PaymentVerified, OrderId]);
        res.send({ message: "Updated" })
    } catch (err) {
        console.log("error in the payVerify", err);
        return res.status(500).send({ error: "INternal server error" });
    }

});


// router.post('/addProduct', protectRouteForBoth, async (req, res) => {
//     try {
//         await connection.query(Queries.productQueries.createProductTable);
//         const { ProductName, Cost, SubCategory, offer } = req.body;
//         for (const productData of req.body) {
//             await connection.query(Queries.productQueries.insertIntoProductTable, [productData.ProductName, productData.Cost, productData.SubCategory, productData.offer]);
//         }
//         res.send({ message: "Products added Successfully" })
//     } catch (err) {
//         console.log("error in the addProduct", err);
//         return res.status(500).send({ error: "INternal server error" });
//     }
// })



router.post('/getTransaction/:transId', protectRouteForBoth, async (req, res) => {
    try {
        const transId = req.params.transId;
        const result = await connection.query(Queries.transactionQueries.getTransactionTableByTransId, [transId]);
        res.send(result)
    } catch (err) {
        console.log("error in the getTransaction", err);
        return res.status(500).send({ error: "INternal server error" });
    }
});

router.post('/getproducts', async (req, res) => {
    try {
        const query = 'SELECT * FROM Product'
        const [result] = await connection.query(query)
        res.status(200).send(result)
    }
    catch (err) {
        console.log("error in the getproducts", err);
        return res.status(500).send({ error: "INternal server error" });
    }

});


router.post("/getAllAdmins", protectRouteForBoth, async (req, res) => {
    try {
        const [users] = await connection.execute(Queries.adminQueries.getAllAdminLoginsAndLogouts);
        return res.status(200).send(users);
    } catch (error) {
        console.log("error in the getAllAdmins", err);
        return res.status(500).send({ error: "INternal server error" });
    }
})


router.post("/encryptAllpasswords", async (req, res) => {
    try {
        const [users] = await connection.query(Queries.customerQueries.getPasswordAndEmail);
        for (let i = 0; i < users.length; i++) {
            let salt = await bcrypt.genSalt(10);
            let hashPassword = await bcrypt.hash(users[i].password, salt);
            await connection.query(Queries.customerQueries.encryptAllPasswords, [hashPassword, users[i].email]);
        }
        return res.status(200).send({ message: "All the passwords are encrypted..." });
    } catch (error) {
        console.log("error in the encryptAllpasswords, ", err);
        return res.status(500).send({ error: "INternal server error" });
    }
})



// router.post('/createShipment/:OrderId', async(req, res) => {
//     try{
//     await connection.query(shipment.createShipment);
//     const OrderId = req.params.OrderId;
//     const ProductName = req.body.ProductName;
//     const ShippingAddress = req.body.ShippingAddress;
//     const orderQuery = "SELECT orderId FROM orderDetails WHERE payment_status = 1 and payment_verified = 1 ORDER BY orderId DESC LIMIT 1";
//     if (orderQuery.length === 0) {
//         return res.status(400).send({ message: "No pending orders found" });
//     }
//     await connection.query(shipment.insertShipment, [OrderId, ProductName, ShippingAddress]);
//     res.send({message:"Shipment created"})
// } catch(err){
//     console.log(err)
// }
// });

router.post("/feedback", async (req, res) => {
    try {
        const { feedback, rating } = req.body;
        const query = `CREATE TABLE IF NOT EXISTS b2bfeedback (feedback VARCHAR(255), rating INT);`;
        await connection.query(query);

        const insert = `INSERT INTO b2bfeedback (feedback, rating) VALUES (?, ?)`;
        await connection.query(insert, [feedback, rating]);

        res.status(200).send({ message: "Feedback added" });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Error Adding Feedback");
    }

})



router.post('/addProduct', protectRouteForBoth, async (req, res) => {
    try {
        await connection.query(Queries.productQueries.createProductTable);

        const { name, CommonImage, description, offerStartDate, offerStartTime, offerDuration, costPerUnit, category, productId } = req.body;
        const [latestProductId] = await connection.query('SELECT * FROM Product ORDER BY productId DESC LIMIT 1');
        let newProductId = "B2BPD0001";

        if (latestProductId && latestProductId.length > 0) {
            const product = latestProductId[0].productId;
            const numericPart = product.slice(5);
            const currentId = parseInt(numericPart, 10);
            const newId = currentId + 1;
            newProductId = `B2BPD${String(newId).padStart(4, '0')}`;
        }
        const descriptionString = JSON.stringify(description);
        const costPerUnitString = JSON.stringify(costPerUnit);
        await connection.query(Queries.productQueries.insertIntoProductTable, [
            newProductId,
            name,
            CommonImage,
            descriptionString,
            offerStartDate,
            offerStartTime,
            offerDuration,
            costPerUnitString,
            category
        ]);
        await connection.query(Queries.sellerQueries.insertSellerProducts);

        await connection.query(Queries.sellerQueries.updateProductStatusId, [productId])



        res.status(201).send({ message: "Product added successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Failed to add product" });
    }
});

router.post('/getProducts', async (req, res) => {
    try {
        const result = await connection.query('SELECT * FROM Product');
        res.status(200).send(result[0]);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Internal server error..." });
    }
});

router.post("/getAllProductsForAdmin", protectRouteForBoth, async (req, res) => {
    try {
        const result = await connection.query('SELECT * FROM Product');
        res.status(200).send(result[0])
    } catch (err) {
        console.log(err)
        return res.status(500).send({ error: "Internal server error..." });
    }
});



router.delete('/deleteProduct/:productId', protectRouteForBoth, async (req, res) => {
    try {
        const productId = req.params.productId;
        await connection.query(Queries.productQueries.deleteProduct, [productId]);
        res.status(200).send({ message: "Deleted" })
    } catch (err) {
        console.log(err)
        res.status(404).send("Error deleting Product")
    }
});


router.put('/updateProduct/:productId', protectRouteForBoth, async (req, res) => {
    try {
        const productId = req.params.productId;
        const updates = req.body;
        if (Object.keys(updates).length === 0) {
            return res.status(400).send({ message: "No fields provided for update" });
        }
        const setClause = Object.keys(updates)
            .map(key => `${key} = ?`)
            .join(', ');

        const query = `UPDATE Product SET ${setClause} WHERE productId = ?`;
        const values = [...Object.values(updates), productId];
        await connection.query(query, values);

        res.send({ message: "Product updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Failed to update product" });
    }
});



router.put('/updatePrice/:productId', protectRouteForBoth, async (req, res) => {
    try {
        const productId = req.params.productId;
        const { pricePerUnit } = req.body;
        const [currentProduct] = await connection.query('SELECT costPerUnit FROM Product WHERE productId = ?', [productId]);
        if (currentProduct.length === 0) {
            return res.status(404).send({ message: "Product not found" });
        }
        let costPerUnit = currentProduct[0].costPerUnit;
        if (typeof costPerUnit === 'string') {
            try {
                costPerUnit = JSON.parse(costPerUnit);
            } catch (err) {
                return res.status(500).send({ error: "Invalid JSON data in costPerUnit" });
            }
        }
        costPerUnit.forEach(item => {
            item.PricePerUnit = pricePerUnit;
        });
        const updatedCostPerUnit = JSON.stringify(costPerUnit);
        await connection.query('UPDATE Product SET costPerUnit = ? WHERE productId = ?', [updatedCostPerUnit, productId]);
        res.send({ message: "Product updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: "Failed to update product" });
    }
});




module.exports = router;




