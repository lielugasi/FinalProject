const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { EventModel, eventValid } = require("../models/eventModel");
const { ClientModel } = require("../models/clientModel");
const { ProffesionalModel } = require("../models/proffesionalModel");

// ראוטר שמחזיר את רשימת כל האירועים(רק אדמין יכול)
router.get("/", authAdmin, async (req, res) => {
    let perPage = req.query.perPage || 20;
    try {
        let data = await EventModel.find({}).limit(perPage)
            //מראה בכל אירוע את הרשימת של בעלי המקצוע והפרטים שלהם וגם את הפרטים של הלקוח 
            .populate({ path: "proffesionals", model: "proffesionals" })
            .populate({ path: "client_id", model: "clients" });
        res.json(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

// יצירת אירוע ושמירת האירוע במערך האירועים של המשתמש והבעל מקצוע
router.post("/", auth, async (req, res) => {
    let validateBody = eventValid(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details)
    }
    try {
        let event = new EventModel(req.body);
        event.client_id = req.tokenData._id;
        await event.save();
        let client = ClientModel.findOne({ _id: req.tokenData._id });
        client.events.push(event);
        await client.save();
        let proffesionals = ProffesionalModel.find(event.proffesionals.includes(_id));
        proffesionals.map(async item => {
            item.events.push(event);
            await item.save()
        })
        res.status(201).json(event);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

router.delete("/:idDel", auth, async (req, res) => {
    let idDelete = req.params.idDel;
    let data;
    try {
        if (req.tokenData.role == "admin") {
            data = await EventModel.deleteOne({ _id: idDelete });
        }
        else if (idDelete != req.tokenData._id) {
            return res.status(403).json({ msg: "Unauthorized access" });
        }
        else {
            data = await EventModel.deleteOne({ _id: idDelete });
            let client = ClientModel.findOne({ _id: req.tokenData._id });
            let eventClientIndex = client.events.indexOf(data);
            client.events.splice(eventClientIndex, 1);
            await client.save();
            let proffesionals = ProffesionalModel.find(data.proffesionals.includes(_id));
            proffesionals.map(async item => {
                let eventProffesionalIndex = item.events.indexOf(data);
                item.events.splice(eventProffesionalIndex, 1);
                await item.save();
            })
        }
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

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

