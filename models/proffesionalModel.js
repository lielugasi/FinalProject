const mongoose = require('mongoose');
const Joi = require("joi");
const {joiSchemaPerson } = require('./personModel');
const proffesionalSchema = new mongoose.Schema({
    area:String,
    category:String,
    event_type:String,
    cost:Number
})
exports.proffesionalModel = personModel.discriminator('proffesionals', proffesionalSchema);

exports.proffesionalValid = (_reqBody) => {
    let joiSchemaProffesional = joiSchemaPerson.keys({
        area: Joi.string().min(2).max(99).required(),
        category: Joi.string().min(2).max(99).required(),
        event_type: Joi.string().min(2).max(99).required(),
        cost: Joi.number().required()
    });
    return joiSchemaProffesional.validate(_reqBody)
}
