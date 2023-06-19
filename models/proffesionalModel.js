const mongoose = require('mongoose');
const Joi = require("joi");
const {joiSchemaPerson } = require('./personModel');
const proffesionalSchema = new mongoose.Schema({
    area:{
        type: String, enum:['center', 'jerusalem', 'north' ,'south']
    },
    category:String,
    event_type:[{
        type: String, enum:['wedding']
    }],
    cost:Number,
    events:  [{
        type: Schema.Types.ObjectId,
        ref: 'events',
    }],
})
exports.ProffesionalModel = PersonModel.discriminator('proffesionals', proffesionalSchema);

exports.proffesionalValid = (_reqBody) => {
    let joiSchemaProffesional = joiSchemaPerson.keys({
        area: Joi.string().valid('center', 'jerusalem', 'north' ,'south').required(),
        category: Joi.string().min(2).max(99).required(),
        event_type: Joi.array().items(Joi.string().valid('wedding')).min(1),
        cost: Joi.number().required()
    });
    return joiSchemaProffesional.validate(_reqBody)
}
