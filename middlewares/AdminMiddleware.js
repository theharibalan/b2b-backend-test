const jwt = require("jsonwebtoken");
const connection = require("../database");
const Queries = require("../SQL/Queries/Queries.json");

const protectRouteForBoth = async (req, res, next) => {
	try {
		const { authorization } = req.headers;
		//console.log(authorization)


		if (!authorization) {
			return res.status(401).send({ error: "UnAuthorized - No token provided..." });
		}
		const token = authorization.replace("Bearer ", "");

		const decoded = jwt.verify(token, process.env.SECRET_KEY);

		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized - Invalid Token" });
		}
		const [user] = await connection.query(Queries.adminQueries.getAdmin, [decoded.email]);

		if (user.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		req.user = user[0];

		console.log("Admin middleware email: ", user[0].email);


		next();
	} catch (error) {
		console.error("Error in protectRoute middleware: ", error.message);

		if (error.name === 'JsonWebTokenError') {
			// Invalid token
			return res.status(401).json({ error: "Unauthorized - Invalid token" });
		} else if (error.name === 'TokenExpiredError') {
			// Token expired
			return res.status(403).json({ error: "Unauthorized - Token has expired" });
		}

		// Internal server error
		res.status(500).json({ error: "Internal server error" });
	}
};

const protectRouteForAdmin = async (req, res, next) => {
	try {
		const { authorization } = req.headers;
		//console.log(authorization)


		if (!authorization) {
			return res.status(401).send({ error: "UnAuthorized - No token provided..." });
		}
		const token = authorization.replace("Bearer ", "");

		const decoded = jwt.verify(token, process.env.SECRET_KEY);

		if (!decoded) {
			return res.status(401).json({ error: "Unauthorized - Invalid Token" });
		}
		const [user] = await connection.query(Queries.adminQueries.getAdmin, [decoded.email]);

		if (user.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		req.user = user[0].email;
		if (user[0].role === "ADMIN") {
			console.log("Admin middleware email: ", user[0].email);
			next();
		}
		else{
			return res.status(401).json({ error: "Unauthorized - For accessing this route" });
		}

	} catch (error) {
		console.error("Error in protectRoute middleware: ", error.message);

		if (error.name === 'JsonWebTokenError') {
			// Invalid token
			return res.status(401).json({ error: "Unauthorized - Invalid token" });
		} else if (error.name === 'TokenExpiredError') {
			// Token expired
			return res.status(403).json({ error: "Unauthorized - Token has expired" });
		}

		// Internal server error
		res.status(500).json({ error: "Internal server error" });
	}
};

module.exports = { protectRouteForAdmin, protectRouteForBoth };


