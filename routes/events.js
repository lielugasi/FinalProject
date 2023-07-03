const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { EventModel, eventValid } = require("../models/eventModel");
const { ClientModel } = require("../models/clientModel");
const { ProffesionalModel } = require("../models/proffesionalModel");

// ראוטר שמחזיר את רשימת כל האירועים(רק אדמין יכול)
router.get("/", authAdmin, async (req, res) => {
    let page = req.query.page || 1;
    let perPage = req.query.perPage || 10;
    try {
        let data = await EventModel.find({}).limit(perPage)
            .skip((page - 1) * perPage)
            //מראה בכל אירוע את הרשימת של בעלי המקצוע והפרטים שלהם וגם את הפרטים של הלקוח 
            .populate({ path: "proffesionals", model: "proffesionals" })
            .populate({ path: "client_id", model: "clients" });
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

router.get("/single/:id", auth, async (req, res) => {
    const eventId = req.params.id;

    try {
        const event = await EventModel.findById(eventId)
            .populate({ path: "proffesionals", model: "proffesionals" })
            .populate({ path: "client_id", model: "clients" });

        if (!event) {
            return res.status(404).json({ msg: "Event not found" });
        }

        // Check user access based on role
        if (req.tokenData.role === "admin") {
            // Admin can see all events
            res.json(event);
        } else if (req.tokenData.role === "client") {
            console.log(event.client_id._id.toString());
            console.log(req.tokenData._id.toString());
            // Client can see only their events
            if (event.client_id._id.toString() !== req.tokenData._id.toString()) {
                return res.status(403).json({ msg: "Unauthorized access" });
            }
            res.json(event);
        } else if (req.tokenData.role === "proffesional") {
            // Professional can see only events they are part of
            const professional = await ProffesionalModel.findOne({ _id: req.tokenData._id });
            console.log(professional);
            console.log(professional.events);
            if (!professional) {
                return res.status(404).json({ msg: "Professional not found" });
            }
            if (!professional.events.includes(eventId)) {
                return res.status(403).json({ msg: "Unauthorized access" });
            }
            res.json(event);
        } else {
            res.status(403).json({ msg: "Unauthorized access" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Server Error", error });
    }
});

// יצירת אירוע ושמירת האירוע במערך האירועים של המשתמש והבעל מקצוע
router.post("/", auth, async (req, res) => {
    const validateBody = eventValid(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details);
    }
    try {
        const event = new EventModel(req.body);
        event.client_id = req.tokenData._id;
        await event.save();

        const eventPro = await EventModel.findOne({ _id: event._id })
            .populate({ path: "proffesionals", model: "proffesionals" });

        const client = await ClientModel.findOne({ _id: req.tokenData._id })
        if (!client) {
            return res.status(404).json({ msg: "Client not found" });
        }

        client.events.push(event._id);
        await client.save();

        const professionals = await ProffesionalModel.find({ _id: { $in: event.proffesionals } })
        const updatePromises = professionals.map(async (professional) => {
            professional.events.push(event._id);
            await professional.save();
        });
        await Promise.all(updatePromises);

        res.status(201).json(eventPro);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Internal Server Error", err });
    }
});

router.get("/count", authAdmin, async (req, res) => {
    try {
        let count = await EventModel.countDocuments({})
        res.json({ count })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

// router.post("/", auth, async (req, res) => {
//     let validateBody = eventValid(req.body);
//     if (validateBody.error) {
//         return res.status(400).json(validateBody.error.details)
//     }
//     try {
//         let event = new EventModel(req.body);
//         event.client_id = req.tokenData._id;
//         await event.save();
//         let client = ClientModel.findOne({ _id: req.tokenData._id });
//         client.events.push(event);
//         await client.save();
//         let proffesionals = ProffesionalModel.find(event.proffesionals.includes(_id));
//         proffesionals.map(async item => {
//             item.events.push(event);
//             await item.save()
//         })
//         res.status(201).json(event);
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({ msg: "err", err });
//     }
// })

router.delete("/:idDel", auth, async (req, res) => {
    const eventId = req.params.idDel;
    const client = await ClientModel.findOne({ _id: req.tokenData._id });
    const event = await EventModel.findOne({ _id: eventId });
    try {

        if (req.tokenData.role === "admin") {
            // Admin can directly delete the event
            await EventModel.deleteOne({ _id: eventId });
        } else {
            // Find the client and check if the event belongs to them

            if (!client || !event) {
                return res.status(404).json({ msg: "Event or Client not found" });
            }

            if (event.client_id.toString() !== client._id.toString()) {
                return res.status(403).json({ msg: "Unauthorized access" });
            }
            await EventModel.deleteOne({ _id: eventId });
        }
        // Delete the event from the client's events array
        const eventClientIndex = client.events.indexOf(eventId);
        client.events.splice(eventClientIndex, 1);
        await client.save();

        // Delete the event from professionals' events arrays
        const professionals = await ProffesionalModel.find({ _id: { $in: event.proffesionals } });
        const deletePromises = professionals.map(async (professional) => {
            const eventProfessionalIndex = professional.events.indexOf(eventId);
            professional.events.splice(eventProfessionalIndex, 1);
            await professional.save();
        });
        await Promise.all(deletePromises);

        // Finally, delete the event itself



        res.json({ msg: "Event deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Internal Server Error", err });
    }
});



// router.delete("/:idDel", auth, async (req, res) => {
//     let idDelete = req.params.idDel;
//     let data;
//     try {
//         if (req.tokenData.role == "admin") {
//             data = await EventModel.deleteOne({ _id: idDelete });
//         }
//         else if (idDelete != req.tokenData._id) {
//             return res.status(403).json({ msg: "Unauthorized access" });
//         }
//         else {
//             data = await EventModel.deleteOne({ _id: idDelete });
//             let client = ClientModel.findOne({ _id: req.tokenData._id });
//             let eventClientIndex = client.events.indexOf(data);
//             client.events.splice(eventClientIndex, 1);
//             await client.save();
//             let proffesionals = ProffesionalModel.find(data.proffesionals.includes(_id));
//             proffesionals.map(async item => {
//                 let eventProffesionalIndex = item.events.indexOf(data);
//                 item.events.splice(eventProffesionalIndex, 1);
//                 await item.save();

//             })
//         }
//         res.json(data);
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({ msg: "err", err });
//     }
// })

//עריכת אירוע-לוגיקה מוגזמת מידי
// router.put("/:idEdit", auth, async (req, res) => {
//     let validateBody = eventValid(req.body);
//     if (validateBody.error) {
//         return res.status(400).json(validateBody.error.details);
//     }
//     try {
//         let idEdit = req.params.idEdit;
//         let data;
//         if (req.tokenData.role == "admin") {
//             data = await EventModel.updateOne({ _id: idEdit }, req.body);
//         }
//         else if (idEdit != req.tokenData._id) {
//             return res.status(403).json({ msg: "Unauthorized access" })
//         }
//         else {
//             data = await EventModel.updateOne({ _id: idEdit }, req.body);
//         }
//         res.json(data);
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({ msg: "err", err });
//     }
// })

module.exports = router;

