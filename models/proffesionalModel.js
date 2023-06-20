const mongoose = require('mongoose');
const Joi = require("joi");
const {joiSchemaUser, userModel } = require('./userModel');
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
        type: mongoose.ObjectId,
        ref: 'events',
    }],
    // role: {
    //     type: String, default: "proffesional"
    // },
})
exports.ProffesionalModel = userModel.discriminator('proffesionals', proffesionalSchema);

exports.proffesionalValid = (_reqBody) => {
    let joiSchemaProffesional = joiSchemaUser.keys({
        area: Joi.string().valid('center', 'jerusalem', 'north' ,'south').required(),
        category: Joi.string().min(2).max(99).required(),
        event_type: Joi.array().items(Joi.string().valid('wedding')).min(1),
        cost: Joi.number().required()
    });
    return joiSchemaProffesional.validate(_reqBody)
}
