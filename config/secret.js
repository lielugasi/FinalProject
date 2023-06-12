require("dotenv").config();
exports.config={
    userDb:process.env.USER_DB,
    passwordDb:process.env.USER_PASSWORD,
    tokenSecret:process.env.TOKENSECRET
}