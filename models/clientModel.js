const mongoose = require('mongoose');
const Joi = require("joi");
const { joiSchemauser } = require('./userModel');
const clientSchema = new mongoose.Schema({
    address: {
        city: String,
        street: String,
        building: Number
    },
    events:  [{
        type: Schema.Types.ObjectId,
        ref: 'events',
    }],
})
exports.ClientModel = userModel.discriminator('clients', clientSchema);

exports.clientValid = (_reqBody) => {
    let joiSchemaClient = joiSchemauser.keys({
        city: Joi.string().min(2).max(99).required(),
        street: Joi.string().min(2).max(99).required(),
        building: Joi.number().required()
    });
    return joiSchemaClient.validate(_reqBody)
}

