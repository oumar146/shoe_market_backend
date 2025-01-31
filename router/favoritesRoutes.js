const express = require("express");
const router = express.Router();
const {
  addFavourite,
  getFavourites,
  deleteFavourite,
  checkFavouriteStatus
} = require("../controllers/favoriteCtrl");
// Middleware pour l'authentification des utilisateurs
const auth = require("../middleware/auth");
// Connexion à la base de données
const client = require("../dataBase");

// Routes pour les catégories
router.post("/new", (req, res) => addFavourite(req, res, client)); // Créer une nouvelle catégorie
router.post("/get", (req, res) => getFavourites(req, res,client)); // Obtenir toutes les catégories
router.post("/status",  (req, res) => checkFavouriteStatus(req, res, client)); // Verifier une catégorie
router.delete("/delete",  (req, res) => deleteFavourite(req, res, client)); // Supprimer une catégorie


module.exports = router;
