const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { ClientModel, clientValid } = require("../models/clientModel");
const { userValidLogin, userModel, userValid } = require("../models/userModel");
const { createToken } = require("../models/userModel")
//הצגת כל המשתמשים במערכת
router.get("/usersList", auth, async (req, res) => {
  let perPage = req.query.perPage || 10;
  try {
    let data = await userModel.find({}, { password: 0 })
      .limit(perPage);
    res.json(data);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "err", err });
  }
})
// כניסת לקוח קיים למערכת
router.post("/login", async (req, res) => {
  let validateBody = userValidLogin(req.body);
  if (validateBody.error) {
    return res.status(400).json(validateBody.error.details);
  }
  try {
    let user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ msg: "Email or password is wrong, code:1" });
    }
    let validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) {
      return res.status(401).json({ msg: "Email or password is wrong, code: 2" });
    }
    let newToken = createToken(user._id, user.role);
    res.json({ token: newToken });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ msg: "err", err });
  }
})

router.get("/count", authAdmin, async (req, res) => {
  try {
    let count = await userModel.countDocuments({})
    res.json({ count })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ msg: "err", err })
  }
})

// מאפשר לשנות משתמש לאדמין, רק על ידי אדמין אחר
router.patch("/changeRole/:userID", authAdmin, async (req, res) => {
  if (!req.body.role) {
    return res.status(400).json({ msg: "Need to send role in body" });
  }

  try {
    let userID = req.params.userID
    // לא מאפשר ליוזר אדמין להפוך למשהו אחר/ כי הוא הסופר אדמין
    // TODO:move to config
    if (userID == "64907ed6f8769e344175493d") {
      return res.status(401).json({ msg: "You cant change superadmin to user" });

    }
    let data = await userModel.updateOne({ _id: userID }, { role: req.body.role })
    res.json(data);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ msg: "err", err })
  }
})

// מאפשר לגרום למשתמש לא יכולת להוסיף מוצרים חדשים/ סוג של באן שלא מוחק את המשתמש
router.patch("/changeActive/:userID", authAdmin, async (req, res) => {
  if (!req.body.active && req.body.active != false) {
    return res.status(400).json({ msg: "Need to send active in body" });
  }

  try {
    let userID = req.params.userID
    // לא מאפשר ליוזר אדמין להפוך למשהו אחר/ כי הוא הסופר אדמין
    if (userID == "64907ed6f8769e344175493d") {
      return res.status(401).json({ msg: "You cant change superadmin to user" });

    }
    let data = await UserModel.updateOne({ _id: userID }, { active: req.body.active })
    res.json(data);
  }
  catch (err) {
    console.log(err)
    res.status(500).json({ msg: "err", err })
  }
})
// יצירת אדמין חדש
router.post("/newAdmin", authAdmin, async (req, res) => {
  let validateBody = clientValid(req.body);
  if (validateBody.error) {
    return res.status(400).json(validateBody.error.details)
  }
  try {
    let user = new userModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    user.role = "admin",
      await user.save();
    user.password = "*****";
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


// קבלת משתמש לפי איידי
router.get("/single/:id", authAdmin, async(req,res)=>{
  try{
    let idUser = req.params.id;
    let data = await userModel.findOne({ _id: idUser });
    res.json(data);
    }
    catch(err){
      console.log(err);
      res.status(500).json({msg:"err",err})
    }
})

// עריכת אדמין
router.put("/:idEdit", authAdmin, async (req, res) => {
  let validateBody = userValid(req.body);
  if (validateBody.error) {
      return res.status(400).json(validateBody.error.details);
  }
  try {
      let idEdit = req.params.idEdit;
      let data=await userModel.updateOne({ _id: idEdit }, req.body);;
      let user = await userModel.findOne({ _id: idEdit });
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
      user.password = "*****";
      res.json(data);
  }
  catch (err) {
      console.log(err);
      res.status(500).json({ msg: "err", err });
  }
})

router.delete("/:idDel", authAdmin, async (req, res) => {
  try {
    let idDelete = req.params.idDel;
    let data= await ClientModel.deleteOne({ _id: idDelete });
      res.json(data);
  }
  catch (err) {
      console.log(err);
      res.status(500).json({ msg: "err", err });
  }
})
module.exports = router;