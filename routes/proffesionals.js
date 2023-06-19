const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { ProffesionalModel, proffesionalValid } = require("../models/proffesionalModel");


//הצגת רשימת כל בעלי המקצוע(נדרשת כניסה למערכת)
router.get("/proffesionalsList", auth, async (req, res) => {
    let perPage = req.query.perPage || 10;
    try {
        let data = await ProffesionalModel.find({}, { password: 0 })
            .limit(perPage)
            .populate({ path: "events", model: "events" });
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

//הצגת פרטי הבעל מקצוע בודד(לעצמו)
router.get("/myInfo", auth, async (req, res) => {
    try {
        let professional = await ProffesionalModel.findOne({ _id: req.tokenData._id })
        .populate({ path: "events", model: "events" });
        res.json(professional);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

//הרשמה של בעל מקצוע למערכת
router.post("/signUp", async(req,res)=>{
    let validateBody = clientValid(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details)
    }
    try {
        let professional = new ProffesionalModel(req.body);
        professional.password = await bcrypt.hash(professional.password, 10);
        await professional.save();
        professional.password = "*****";
        res.status(201).json(professional);
    }
    catch (err) {
        if (err.code == 11000) {
            return res.status(400).json({ msg: "Email already in system try login", code: 11000 })
        }
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
}) 

//מחזיר כמה בעלי מקצוע פעילים במערכת
router.get("/count", authAdmin, async (req, res) => {
    try {
      let count = await ProffesionalModel.countDocuments({})
      res.json({ count })
    }
    catch (err) {
      console.log(err)
      res.status(500).json({ msg: "err", err })
    }
  })

// עריכת פרטי בעל מקצוע(אדמין עורך את כולם, בעל מקצוע עורך את עצמו)
router.put("/:idEdit", auth, async (req, res) => {
    let validateBody = proffesionalValid(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details);
    }
    try {
        let idEdit = req.params.idEdit;
        let data;
        if (req.tokenData.role == "admin") {
            data = await ProffesionalModel.updateOne({ _id: idEdit }, req.body);
        }
        else if (idEdit != req.tokenData._id) {
            return res.status(403).json({ msg: "Unauthorized access" })
        }
        else {
            data = await ProffesionalModel.updateOne({ _id: idEdit }, req.body);
        }
        let professional = await ProffesionalModel.findOne({ _id: idEdit });
        professional.password = await bcrypt.hash(professional.password, 10);
        await professional.save();
        professional.password = "*****";
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

//מחיקת בעל מקצוע מהמערכת(אדמין מוחק את כולם, בעל מקצוע מוחק את עצמו)
router.delete("/:idDel", auth, async (req, res) => {
    let idDelete = req.params.idDel;
    let data;
    try {
        if (req.tokenData.role == "admin") {
            data = await ProffesionalModel.deleteOne({ _id: idDelete });
        }
        else if (idDelete != req.tokenData._id) {
            return res.status(403).json({ msg: "Unauthorized access" });
        }
        else {
            data = await ProffesionalModel.deleteOne({ _id: idDelete });
        }
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})

// ראוטר של חיפוש בעל מקצוע לפי שם
// חיפוש בעל מקצוע לפי קטגוריה
// חיפוש לפי מיקום
// חיפוש לפי טווח מחירים
module.exports = router;