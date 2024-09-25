const express = require('express')
const router = express.Router()
const Queries = require('../SQL/Queries/Queries.json')
const connection = require('../database')
const Middleware = require("../middlewares/Middleware")
const {protectRouteForBoth} = require("../middlewares/AdminMiddleware")
const send = require("../mailservice/EmailAdminBYOrderMaking");

function getCurrentDateWithoutTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
}

// requesting the po by admin

router.post("/addPo", protectRouteForBoth, async( req, res) => {
    try {
        const { customerId, quantity, price, productName, productId } = req.body;
        if( !customerId || !quantity || !price || !productName || !productId)
        {
            return res.status(400).send({error: "All fields are required..."});
        }
        const createdAt = getCurrentDateWithoutTime();
        let newItemId = "POID000001";
        const [rows] = await connection.query(Queries.POQueries.getCount);
        if (rows.length > 0 && rows[0].poId) {
            const latestItemId = rows[0].poId;
            const currentIdNumber = parseInt(latestItemId.slice(-6));
            const newIdNumber = currentIdNumber + 1;
            newItemId = `POID${ String(newIdNumber).padStart(6, '0') }`;
        }
        const [result] = await connection.query(Queries.POQueries.insertPO, [newItemId, customerId, null, quantity, price, createdAt, productId]);
        
        if(result.affectedRows === 0)
        {
            return res.status(400).send({error: "While raising the po, error occured."});
        }
        const [sellerDetails] = await connection.query(Queries.customerQueries.getCustomerById, [customerId]);
        await send(sellerDetails.CompanyName, sellerDetails[0].Email, productName, quantity, price);
        const query = Queries.AdminTracker.insert;
        await connection.query(query, [req.user.empId, req.user.role, "Created Purchase Order...", newItemId]);
        return res.status(201).send({message: "Purchase order created"});
    } catch (error) {
        console.log("error in the addpo, ", error);
        return res.status(500).send({error: "Internal server error..."});
    }
});


// getting all the pos for admin


router.post("/getAllPos",protectRouteForBoth, async(req, res) => {
    try {
        const [result] = await connection.query(Queries.POQueries.getAllPos);
        return res.status(200).send(result);
    } catch (error) {
        console.log("error in the getAllPos, ", error);
        return res.status(500).send({error: "Internal server error..."});
    }
});


//getting po by customerId


router.post("/getPoById", Middleware, async(req, res) => {
    try {
        const customerId = req.user;
        const [result] = await connection.query(Queries.POQueries.getPo, [customerId]);
        return res.status(200).send(result);
    } catch (error) {
        console.log("error in the getPoById, ", error);
        return res.status(500).send({error: "Internal server error."});
    }
})





router.put("/uploadPo", Middleware, async( req, res) => {
    try {
        const {poId, updatedAt, purchaseOrderURL, productId} = req.body;
        if(!poId || !updatedAt || !purchaseOrderURL || !productId )
        {
            return res.status(400).send({error: "All the fioelds are required.."});
        }
        const [result] = await connection.query(Queries.POQueries.updatePOURLAndStatusById, [purchaseOrderURL, true,  updatedAt, poId]);

        if(result.affectedRows === 0)
        {
             res.status(404).send({error: "Failed to update the Po details..."});
        }
        await connection.query(Queries.sellerQueries.updatePublishByProductId, [productId]);
        return res.status(200).send({message: "Po details are uploaded."});
    } catch (error) {
        console.log("error in the upload, ", error);
        return res.status(500).send({error: "Internal server error..."});
    }
});

module.exports = router;