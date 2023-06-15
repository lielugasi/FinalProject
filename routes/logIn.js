const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { ClientModel, clientValid } = require("../models/clientModel");
const { personValidLogin } = require("../models/personModel");

// כניסת לקוח קיים למערכת
router.post("/login", async (req, res) => {
    let validateBody = personValidLogin(req.body);
    if (validateBody.error) {
        return res.status(400).json(validateBody.error.details);
    }
    try {
        let client = await ClientModel.findOne({ email: req.body.email });
        if (!client) {
            return res.status(401).json({ msg: "Email or password is wrong, code:1" });
        }
        let validPass = await bcrypt.compare(req.body.password, client.password);
        if (!validPass) {
            return res.status(401).json({ msg: "Email or password is wrong, code: 2" });
        }
        let newToken = createToken(client._id, client.role);
        res.json({ token: newToken });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err", err });
    }
})