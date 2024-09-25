const jwt = require("jsonwebtoken");
require('dotenv').config();

const generateTokenAndSetCookie = (email) => {
	const token = jwt.sign({ email }, process.env.SECRET_KEY, {
		expiresIn: "1d",
	});
	return token;
};

module.exports = generateTokenAndSetCookie;