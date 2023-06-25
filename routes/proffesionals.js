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

// ראוטר שמחזיר פרטי בעל מקצוע בודד לפי id 
router.get("/single/:id", async (req, res) => {
    try {
        let idProffesional = req.params.id;
        let data = await ProffesionalModel.findOne({ _id: idProffesional });
        res.json(data);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err })
    }
})


//מחזיר רשימת בעלי מקצוע לפי טווח מחירים עם אפשרות למיון ורוורס
router.get("/price", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "cost";
    let reverse = req.query.reverse == "yes" ? -1 : 1;
    const minCost = req.query.minCost;
    const maxCost = req.query.maxCost;

    try {
        const professionals = await ProffesionalModel.find({
            cost: { $gte: minCost, $lte: maxCost }
        }).limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse });

        res.json(professionals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Server Error", error });
    }
});

//ראוטר שמחזיר בעלי מקצוע לפי אזור עם אפשרויות מיון
router.get("/area", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "cost";
    let reverse = req.query.reverse == "yes" ? -1 : 1;
    const area = req.query.area;

    try {
        const professionals = await ProffesionalModel.find({
            area: { $regex: new RegExp(area, "i") }
        }).limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse });

        res.json(professionals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Server Error", error });
    }
});

// ראוטר שמחזיר בעלי מקצוע לפי קטגוריה
router.get("/category", async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "cost";
    let reverse = req.query.reverse == "yes" ? -1 : 1;
    const category = req.query.category;

    try {
        const professionals = await ProffesionalModel.find({
            category: { $regex: new RegExp(category, "i") }
        }).limit(perPage)
            .skip((page - 1) * perPage)
            .sort({ [sort]: reverse });

        res.json(professionals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal Server Error", error });
    }
});

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

//הרשמה של בעל מקצוע למערכת
router.post("/signUp", async (req, res) => {
    let validateBody = proffesionalValid(req.body);
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