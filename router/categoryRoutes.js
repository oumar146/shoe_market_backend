const express = require("express");
const router = express.Router();
const {
  newCategory,
  updateCategory,
  getAllCategory,
  deleteCategory,
} = require("../controllers/categoryCtrl");
// Middleware pour l'authentification des utilisateurs
const auth = require("../middleware/auth");
// Connexion à la base de données
const client = require("../dataBase");

// Routes pour les catégories
router.post("/new", (req, res) => newCategory(req, res, client)); // Créer une nouvelle catégorie
router.get("/get", (req, res) => getAllCategory(req, res,client)); // Obtenir toutes les catégories
router.put("/update", (req, res) => updateCategory(req, res, client)); // Mettre à jour une catégorie
router.delete("/delete", (req, res) => deleteCategory(req, res, client)); // Supprimer une catégorie

module.exports = router;
