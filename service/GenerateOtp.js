const crypto = require("crypto");

const generateOtp = () => {
    let otp = crypto.randomInt(100000, 1000000).toString();
    return otp;
}

module.exports = generateOtp;