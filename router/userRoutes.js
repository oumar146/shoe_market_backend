const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/userCtrl");
const client = require("../dataBase");

//Routes
router.post("/signup", (req, res) => signup(req, res, client));
router.post("/login", (req, res) => login(req, res, client));

module.exports = router;
