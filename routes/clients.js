const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { ClientModel, clientValid } = require("../models/clientModel");
const { userValidLogin } = require("../models/userModel");
const { ProffesionalModel } = require("../models/proffesionalModel")

//מחזיר את רשימת הלקוחות הרשומים לאתר
router.get("/clientsList", authAdmin, async (req, res) => {

    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "cost";
    let reverse = req.query.reverse == "yes" ? -1 : 1;
    try {
        let data = await ClientModel.find({}, { password: 0 })
            .limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse })
            .populate({ path: "events", model: "events" });
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

// הצגת פרטי לקוח בודד
router.get("/myInfo", auth, async (req, res) => {
    try {
        let client = await ClientModel.findOne({ _id: req.tokenData._id })
            .populate({ path: "events", model: "events" });
        res.json(client);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})


// router.get("/single/:id", async (req, res) => {
//     try {
//         let idClient = req.params.id;
//         let data = await ClientModel.findOne({ _id: idClient }, { password: 0 });
//         res.json(data);
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({ msg: "err", err })
//     }
// })

// 
router.get('/professionals-available', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Convert start and end date strings to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        console.log(start);
        console.log(end);
        // Fetch all professionals
        const allProfessionals = await ProffesionalModel.find().populate({ path: "events", model: "events" });
        // Fetch professionals who have events within the given date range
        const professionalsWithEvents = allProfessionals.filter(proffesional => {
            // proffesional._doc.events.map(item => console.log(item._doc.date));
            const proffesionalEvents = proffesional._doc.events.filter(item => (item._doc.date > start && item._doc.date < end) || (item._doc.date.getFullYear() === start.getFullYear() && item._doc.date.getMonth() === start.getMonth() && item._doc.date.getDate() === start.getDate()) || (item._doc.date.getFullYear() === end.getFullYear() && item._doc.date.getMonth() === end.getMonth() && item._doc.date.getDate() === end.getDate()));
            return proffesionalEvents.length > 0 ? true : false;
        })
        console.log(professionalsWithEvents);
        // Filter professionals who have events on every single date within the range
        const filteredProfessionals = professionalsWithEvents.filter(professional => {
            const eventDates = professional.events.map(event => event.date.toDateString());
            // console.log(eventDates);
            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                // console.log(date);
                if (!eventDates.includes(date.toDateString())) {
                    return false;
                }
            }
            return true;
        });
        console.log(filteredProfessionals);

        // Filter professionals who are not in the filteredProfessionals array
        const remainingProfessionals = allProfessionals.filter(professional => {
            return !filteredProfessionals.some(filteredProfessional => filteredProfessional._id.equals(professional._id));
        });

        res.json(remainingProfessionals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});







//     const startDate = req.query.start;
//     const endDate = req.query.end;

//     try {
//       const professionals = await ProffesionalModel.find({
//         $or: [
//           { events: { $size: 0 } }, // Professionals with no events
//           {
//             events: {
//               $not: {
//                 $elemMatch: { date: { $gte: new Date(startDate), $lte: new Date(endDate) } }
//               }
//             }
//           }
//         ]
//       });

//       res.json(professionals);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ msg: "Internal Server Error", error });
//     }
//   });







router.get("/single/:id", async (req, res) => {
    try{
    let idClient = req.params.id;
    let data = await ClientModel.findOne({ _id: idClient },{password:0});
    res.json(data);
    }
    catch(err){
      console.log(err);
      res.status(500).json({msg:"err",err})
    }
  })
//הרשמה של לקוח למערכת
router.post("/signUp", async (req, res) => {
    let validateBody = clientValid(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details)
    }
    try {
        let client = new ClientModel(req.body);
        client.password = await bcrypt.hash(client.password, 10);
        await client.save();
        client.password = "*****";
        res.status(201).json(client);
    }
    catch (err) {
        if (err.code == 11000) {
            return res.status(400).json({ msg: "Email already in system try login", code: 11000 })
        }
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})
//מחזיר כמה לקוחות פעילים במערכת
router.get("/count", authAdmin, async (req, res) => {
    try {
        let count = await ClientModel.countDocuments({})
        res.json({ count })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ msg: "err", err })
    }
})

//עריכת פרטי לקוח(אדמין עורך את כולם, לקוח עורך את עצמו)
router.put("/:idEdit", auth, async (req, res) => {
    let validateBody = clientValid(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details);
    }
    try {
        let idEdit = req.params.idEdit;
        let data;
        if (req.tokenData.role == "admin") {
            data = await ClientModel.updateOne({ _id: idEdit }, req.body);
        }
        else if (idEdit != req.tokenData._id) {
            return res.status(403).json({ msg: "Unauthorized access" })
        }
        else {
            data = await ClientModel.updateOne({ _id: idEdit }, req.body);
        }
        let client = await ClientModel.findOne({ _id: idEdit });
        client.password = await bcrypt.hash(client.password, 10);
        await client.save();
        client.password = "*****";
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

//מחיקת לקוח מהמערכת(אדמין מוחק את כולם, לקוח מוחק את עצמו)
router.delete("/:idDel", auth, async (req, res) => {
    let idDelete = req.params.idDel;
    let data;
    try {
        if (req.tokenData.role == "admin") {
            data = await ClientModel.deleteOne({ _id: idDelete });
        }
        else if (idDelete != req.tokenData._id) {
            return res.status(403).json({ msg: "Unauthorized access" });
        }
        else {
            data = await ClientModel.deleteOne({ _id: idDelete });
        }
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})
module.exports = router;

