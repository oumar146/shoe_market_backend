const express = require("express");
const router = express.Router();
const {
  newCategory,
  updateCategory,
  getAllCategory,
  deleteCategory,
} = require("../controllers/categoryCtrl");
const auth = require("../middleware/auth");
const client = require("../dataBase");

//Routes
router.post("/new", auth, (req, res) => newCategory(req, res, client));
router.get("/get", auth, (req, res) => getAllCategory(req, res, client));
router.put("/update", auth, (req, res) => updateCategory(req, res, client));
router.delete("/delete", auth, (req, res) => deleteCategory(req, res, client));

module.exports = router;
