const express = require("express");
const router = express.Router();
const {
  newCategory,
  updateCategory,
  getAllCategory,
  deleteCategory,
} = require("../controllers/categoryCtrl");
const client = require("../dataBase");

//Routes
router.post("/new", (req, res) => newCategory(req, res, client));
router.get("/get", (req, res) => getAllCategory(req, res, client));
router.put("/update", (req, res) => updateCategory(req, res, client));
router.delete("/delete", (req, res) => deleteCategory(req, res, client));

module.exports = router;
