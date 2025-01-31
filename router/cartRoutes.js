const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  removeFromCart,
  checkCartStatus
} = require("../controllers/cartCtrl");

// Middleware pour l'authentification des utilisateurs
const auth = require("../middleware/auth");

// Connexion à la base de données
const client = require("../dataBase");

// Routes pour le panier
router.post("/add", (req, res) => addToCart(req, res, client)); // Ajouter un produit au panier
router.post("/get", (req, res) => getCart(req, res, client)); // Obtenir tous les produits du panier
router.post("/status", (req, res) => checkCartStatus(req, res, client)); // Vérifier si un produit est dans le panier
router.delete("/remove", (req, res) => removeFromCart(req, res, client)); // Supprimer un produit du panier

module.exports = router;
