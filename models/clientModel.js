const mongoose = require('mongoose');
const Joi = require("joi");
const { joiSchemaUser, userModel } = require('./userModel');
const clientSchema = new mongoose.Schema({
    address: {
        city: String,
        street: String,
        building: Number
    },
    events: [{
        type: mongoose.ObjectId,
        ref: 'events',
    }],
    // role: {
    //     type: String, default: "client"
    // },
})
exports.ClientModel = userModel.discriminator('clients', clientSchema);

exports.clientValid = (_reqBody) => {
    let joiSchemaClient = joiSchemaUser.keys({
        address: Joi.object({
            city: Joi.string().min(2).max(99).required(),
            street: Joi.string().min(2).max(99).required(),
            building: Joi.number().required()
        }).required()
    });
    return joiSchemaClient.validate(_reqBody)
}

