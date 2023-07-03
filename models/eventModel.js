const mongoose = require('mongoose');
const Joi = require("joi");

const eventSchema = new mongoose.Schema({
    type:{
        type: String, enum:['Wedding','Bar-Miztva','Bat-Mitzva','Brit','Engagement']
    },
    location: String,
    date: Date,
    status: {
        type: String, default: "in process"
    },
    client_id: {
        type: mongoose.ObjectId,
        ref: 'clients',
    },
    proffesionals: [{
        type: mongoose.ObjectId,
        ref: 'professionals',
    }],
})
exports.EventModel = mongoose.model("events", eventSchema);

exports.eventValid = (_reqBody) => {
    joiSchemaEvent = Joi.object({
        type:Joi.string().valid('Wedding','Bar-Miztva','Bat-Mitzva','Brit','Engagement').required(),
        location: Joi.string().min(2).max(999).required(),
        date: Joi.date().required(),
        proffesionals:Joi.array()
    });
    return joiSchemaEvent.validate(_reqBody);
}
