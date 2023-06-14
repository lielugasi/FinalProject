const mongoose = require('mongoose');
const Joi = require("joi");

const eventSchema = new mongoose.Schema({
    type:{
        type: String, enum:['wedding']
    },
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
exports.EventModel = mongoose.model("events", eventSchema);



exports.eventValid = (_reqBody) => {
    joiSchemaEvent = Joi.object({
        type:Joi.string().valid('wedding').required(),
        location: Joi.string().min(2).max(999).required(),
        date: Joi.date().required()
    });
    return joiSchemaEvent.validate(_reqBody);
}
