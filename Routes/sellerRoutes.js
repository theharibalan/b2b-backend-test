const express = require('express')
const router = express.Router()
const Queries = require('../SQL/Queries/Queries.json')
const connection = require('../database')
const Middleware = require("../middlewares/Middleware")
const {protectRouteForBoth} = require("../middlewares/AdminMiddleware")



router.post('/addProduct', Middleware, async (req, res) => {
    try {
        const { productName, productImg, price, units, isOrganic, moisture, shelfLife, validity, description, packaging, productType } = req.body;
        const customerId = req.user;
        if(!req.isSeller)
        {
            return res.status(401).send({error: "Your are unauthorised to added to product"});
        }

        // Validate packaging to ensure it's an object

        if(!productName || !productImg || !price || !units || !isOrganic || !moisture || !shelfLife || !validity || !description || !productType)
        {
            return res.status(400).send({ error: "All the fields are required..." });
        }
        if (typeof packaging !== 'object' || packaging === null) {
            return res.status(400).send({ error: "Invalid packaging data" });
        }

        // Get count and ensure rows and newItemId are defined
        const [rows] = await connection.query(Queries.sellerQueries.getCount);
        let newItemId = "SPID000001";
        if (rows.length > 0 && rows[0].productId) {
            const latestItemId = rows[0].productId;
            const currentIdNumber = parseInt(latestItemId.slice(-6));
            const newIdNumber = currentIdNumber + 1;
            newItemId = `SPID${ String(newIdNumber).padStart(6, '0') }`;
        }
        
        const [category] = await connection.query(Queries.customerQueries.getCategory, [customerId]);
         console.log("---------------category---------", category[0]);
         
        // Insert product
        await connection.query(
            Queries.sellerQueries.insertSellerProducts,
            [
                newItemId,
                customerId,
                productName,
                productImg,
                price,
                units,
                isOrganic,
                moisture,
                shelfLife,
                validity,
                description,
                JSON.stringify(packaging), 
                productType,
                false,
                false,
                "PLATINUM"
            ]
        );

        return res.status(200).send({message: "Product added successfully..."});
    } catch (error) {
        console.log("Error in the addProduct ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});


router.put('/updateProduct/:id', Middleware, async (req, res) => {
    try {
        const { productName, productImg, price, units, isOrganic, moisture, shelfLife, validity, description, packaging, productType } = req.body;
        const {id} = req.params;
        const customerId = req.user;

        if(!req.isSeller)
            {
                return res.status(401).send({error: "Your are unauthorised to added to product"});
            }

        // Validate packaging to ensure it's an object

        if( !id || !productName || !productImg || !price || !units || !isOrganic || !moisture || !shelfLife || !validity || !description || !productType)
        {
            return res.status(400).send({ error: "All the fields are required..." });
        }
        if (typeof packaging !== 'object' || packaging === null) {
            return res.status(400).send({ error: "Invalid packaging data" });
        }

        // Insert product
        const result = await connection.query(
            Queries.sellerQueries.updateProductById,
            [
                productName,
                productImg,
                price,
                units,
                isOrganic,
                moisture,
                shelfLife,
                validity,
                description,
                JSON.stringify(packaging),
                productType,
                customerId,
                id 
            ]
        );
        if(result )

        return res.status(200).send({message: "Product deatils updated successfully..."});
    } catch (error) {
        console.log("Error in the addProduct ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});


router.post("/getProductsBySellerId", Middleware, async( req, res ) => {
    try {
        const customerId = req.user;
        if(!req.isSeller)
            {
                return res.status(401).send({error: "Your are unauthorised to get your product"});
            }
        const [result] = await connection.query(Queries.sellerQueries.getProductsByCustomerId, [customerId]);
        return res.status(200).send(result);
    } catch (error) {
        console.log("Error in the getProductsBySellerId ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});


router.post("/getProductsBySellerId/:id", protectRouteForBoth, async(req, res) => {
    try {
        const {id} = req.params;
        const [result] = await connection.query(Queries.sellerQueries.getProductsByCustomerId, [id]);
        return res.status(200).send(result);
    } catch (error) {
        console.log("Error in the getProductsBySellerId ", error);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
})


router.post("/getProducts", protectRouteForBoth, async( req, res ) => {
    try {
        const [result] = await connection.query(Queries.sellerQueries.getAllProducts);
        return res.status(200).send(result);
    } catch (error) {
        console.log("error in the getProducts, ", error);
        return res.status(500).send({error: "Internal server error"});
    }
})


router.post('/getAllProducts', protectRouteForBoth, async (req, res) => {
    try {
        const [results] = await connection.query(Queries.sellerQueries.getALlSellerProductsAlongWithCustomerDetails);
        return res.status(200).send(results);
    } catch (err) {
        console.log("Error in the getcustomers ", err);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});

router.post("/getProducts/:id", Middleware, async( req, res ) => {
    try {
        if(!req.isSeller)
            {
                return res.status(401).send({error: "Your are unauthorised to added to product"});
            }
        const {id} = req.params;
        const [result] = await connection.query(Queries.sellerQueries.getProductsById, [id]);
        return res.status(200).send(result);
    } catch (error) {
        console.log("Error in the getProducts ", err);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});


router.post("/getProducts", Middleware, async( req, res ) => {
    try {
        const customerId = req.user;
        if(!req.isSeller)
            {
                return res.status(401).send({error: "Your are unauthorised to added to product"});
            }
        const [result] = await connection.query(Queries.sellerQueries.getProductsByCustomerId, [customerId]);
        return res.status(200).send(result);
    } catch (error) {
        console.log("Error in the getProducts ", err);
        return res.status(500).send({
            error: "Internal Server error..."
        });
    }
});


router.delete("/deleteProduct/:id", Middleware, async( req, res ) => {
    try {
        const {id} = req.params;
        const customerId = req.user;
        if(!req.isSeller)
            {
                return res.status(401).send({error: "Your are unauthorised to added to product"});
            }
        if(!id)
        {
            return res.status(400).send({error: "Parameter is required..."});
        }
        const [result] = await connection.query(Queries.sellerQueries.deleteProductById, [customerId, id]);
        if(result.length === 0)
        {
            return res.status(404).send({error: `Product is not found with id ${id}`});
        }
        return res.status(200).send({message: "Product deleted successfully...."});
    } catch (error) {
        console.log("error in the deleteProductById, ", error);
        return res.status(500).send({error: "Internal server error...."});
    }
});

// router.delete("/deleteProduct", Middleware, async( req, res) => {
//     try {
//         const customerId = req.user;
//         const [result] = await connection.query(Queries.sellerQueries.getProductsByCustomerId, [customerId]);
//         if(result.length === 0)
//             {
//                 return res.status(404).send({error: `Product is not found with customerid ${customerId}`});
//             }
//             return res.status(200).send({message: "Product deleted successfully...."});
//     } catch (error) {
//         console.log("Error in the deleteProductByCustomerId, ", error);
//         return res.status(500).send({error: "Internal Server error."});
//     }
// });

router.put("/approveProduct", protectRouteForBoth, async( req, res ) => {
    try {
        const {id} = req.body;
        if(!id)
        {
            return res.status(400).send({error: "Product id is required..."});
        }
        const [result] = await connection.query(Queries.sellerQueries.updateProductStatusId, [id]);
        if(result.affectedRows === 0)
        {
            return res.status(404).send({error: `Product not found with id ${id}`});
        }
        return res.status(200).send({message: "Product is approved..."});
    } catch (error) {
        console.log("error in the approveProduct, ", error);
        return res.status(500).send({error: "Internal server error..."});
    }
})


module.exports = router;


