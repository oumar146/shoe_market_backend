const express = require("express");
const router = express.Router();
const { signup, login, tokenCheck } = require("../controllers/userCtrl");
// Middleware pour l'authentification des utilisateurs
const auth = require("../middleware/auth");
const tokenRenewal = require("../middleware/tokenRenewal");

// Connexion à la base de données
const client = require("../dataBase");

// Routes pour l'inscription, la connexion et la vérification du token
router.post("/signup", (req, res) => signup(req, res, client)); // Inscription
router.post("/login", (req, res) => login(req, res, client)); // Connexion
router.get("/token-check", auth, tokenRenewal, (req, res) =>
  tokenCheck(req, res, client)
); // Vérification du token avec auth

module.exports = router;
