const express = require("express");
const router = express.Router();
// const multer = require("../middleware/multer-config");
const supabase = require("../supabaseClient");

const {
  newProduct,
  getMyProducts,
  getSizes,
  getGenders,
  getStockProducts,
  updateStockQuantity,
  getProducts,
  sendConfirmationEmail,
  getProductByReference,
  deleteProduct,
  updateProduct,
} = require("../controllers/productCtrl");

// Middleware pour l'authentification des utilisateurs
const auth = require("../middleware/auth");
// Middleware pour la gestion des fichiers (images)
const multer = require("../middleware/multer-config");
// Middleware pour renouveler le token d'authentification si nécessaire

const client = require("../dataBase");

// Routes pour les produits
router.post(
  "/new",
  // auth,
  multer, // Gère le téléchargement de fichiers
  (req, res, next) => newProduct(req, res, next, client, supabase), // Créer un nouveau produit
  (req, res) => sendConfirmationEmail(req, res, client) // Envoyer un email de confirmation après la création
);

router.delete(
  "/delete",
  multer,
  // auth,

  (req, res) => deleteProduct(req, res, client, supabase) // Supprimer un produit
);

router.post(
  "/my-offers",
  // auth,
  (req, res) => getMyProducts(req, res, client) // Obtenir les produits de l'utilisateur connecté
);

router.get("/offers", (req, res) => getProducts(req, res, client)); // Obtenir tous les produits disponibles
router.get("/sizes", (req, res) => getSizes(req, res, client)); // Obtenir tous les produits disponibles
router.get("/genders", (req, res) => getGenders(req, res, client)); // Obtenir tous les produits disponibles
router.get("/stock", (req, res) => getStockProducts(req, res, client)); // Obtenir tous les produits disponibles
router.put("/stock/quantity", (req, res) => updateStockQuantity(req, res, client)); // Obtenir tous les produits disponibles



router.get("/:reference", (req, res) =>
  getProductByReference(req, res, client)
); // Obtenir un produit par son identifiant (référence)

router.put(
  "/update",
  multer,
  (req, res) => updateProduct(req, res, client, supabase) // Mettre à jour un produit existant
);

module.exports = router;

