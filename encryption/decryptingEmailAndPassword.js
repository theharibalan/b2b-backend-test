const {decryptData} = require("./encryption.js");

const decodedEmail = async () => {
    const email = await decryptData(process.env.EMAIL_USER);
    return email;
}

const decodedPassword = async() => {
    const passsword = await decryptData(process.env.EMAIL_PASS);
    return passsword;
}

module.exports = {decodedEmail, decodedPassword};