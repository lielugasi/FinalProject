const mongoose = require('mongoose');
const Joi = require("joi");

const eventSchema = new mongoose.Schema({
    type: String,
    location: String,
    date: Date,
    status: {
        type: String, default: "in process"
    },
    client_id: {
        type: Schema.Types.ObjectId,
        ref: 'clients',
    },
    proffesionals: [{
        type: Schema.Types.ObjectId,
        ref: 'professionals',
    }],
})
exports.eventModel = mongoose.model("events", eventSchema);



exports.createToken = (_id, role) => {
    let token = jwt.sign({ _id, role }, config.tokenSecret, { expiresIn: "60mins" });
    return token;
}
exports.joiSchemaevent = Joi.object({
    firstName: Joi.string().min(2).max(99).required(),
    lastName: Joi.string().min(2).max(99).required(),
    email: Joi.string().min(2).max(9999).required(),
    password: Joi.string().min(2).max(99999).required(),
    phone: Joi.string().length(10).pattern(/^[0-9]+$/).required()
})
exports.eventValid = (_reqBody) => {
    return joiSchemaevent.validate(_reqBody);
}
exports.eventValidLogin = (_reqBody) => {
    let joiSchema = Joi.object({
        email: Joi.string().min(2).max(9999).required(),
        password: Joi.string().min(2).max(99999).required()
    })
    return joiSchema.validate(_reqBody);
}