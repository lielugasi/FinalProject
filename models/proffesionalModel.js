const mongoose = require('mongoose');
const Joi = require("joi");
const {joiSchemaUser, userModel } = require('./userModel');
const proffesionalSchema = new mongoose.Schema({
    area:{
        type: String, enum:['center', 'jerusalem', 'north' ,'south']
    },
    category:{
        type:String, enum:['Photographer','Makeup Artist','Hair Stylist','Singer','Band','Event Designer']},
    event_type:[{
        type: String, enum:['wedding']
    }],
    cost:Number,
    events:  [{
        type: mongoose.ObjectId,
        ref: 'events',
    }],
    ig_url:String
    // role: {
    //     type: String, default: "proffesional"
    // },
})
exports.ProffesionalModel = userModel.discriminator('proffesionals', proffesionalSchema);

exports.proffesionalValid = (_reqBody) => {
    let joiSchemaProffesional = joiSchemaUser.keys({
        area: Joi.string().valid('center', 'jerusalem', 'north' ,'south').required(),
        category: Joi.string().valid('Photographer','Makeup Artist','Hair Stylist','Singer','Band','Event Designer').required(),
        event_type: Joi.array().items(Joi.string().valid('wedding')).min(1),
        cost: Joi.number().required(),
        role:Joi.string().valid("proffesional").required(),
        ig_url:Joi.string().min(2).allow(null,"")
    });
    return joiSchemaProffesional.validate(_reqBody)
}
