const mongoose = require('mongoose');
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { config } = require("../config/secret")
const personSchema = new mongoose.Schema({
    name: {
        firstName: String,
        lastName: String
    },
    email: String,
    password: String,
    phone: String,
    dateCreated: {
        type: Date, default: Date.now()
    },
    role: {
        type: String, default: "client"
    }
})
exports.PersonModel = mongoose.model("persons", personSchema);



exports.createToken = (_id, role) => {
    let token = jwt.sign({ _id, role }, config.tokenSecret, { expiresIn: "60mins" });
    return token;
}
exports.joiSchemaPerson = Joi.object({
    firstName: Joi.string().min(2).max(99).required(),
    lastName: Joi.string().min(2).max(99).required(),
    email: Joi.string().min(2).max(9999).required(),
    password: Joi.string().min(2).max(99999).required(),
    phone: Joi.string().length(10).pattern(/^[0-9]+$/).required()
})
exports.personValid = (_reqBody) => {
    return joiSchemaPerson.validate(_reqBody);
}
exports.personValidLogin = (_reqBody) => {
    let joiSchema = Joi.object({
        email: Joi.string().min(2).max(9999).required(),
        password: Joi.string().min(2).max(99999).required()
    })
    return joiSchema.validate(_reqBody);
}