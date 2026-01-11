const express = require("express");
const router = express.Router();
// const multer = require("../middleware/multer-config");
const supabase = require("../supabaseClient");

const {
  newProduct,
  getMyProducts,
  getMenProducts,
  getWomenProducts,
  getUnisexProducts,
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
const multerLib = require("multer");

const storage = multerLib.memoryStorage();

const upload = multerLib({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (optionnel)
});

// Routes pour les produits
router.post(
  "/new",
  upload.any(), // 👈 accepte tous les champs fichiers
  (req, res, next) => newProduct(req, res, next, client, supabase)
  // ,(req, res) => sendConfirmationEmail(req, res, client)
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
router.get("/men", (req, res) => getMenProducts(req, res, client)); // Obtenir tous les produits disponibles pour les Homme
router.get("/women", (req, res) => getWomenProducts(req, res, client)); // Obtenir tous les produits disponibles pour les Femmes
router.get("/unisex", (req, res) => getUnisexProducts(req, res, client)); // Obtenir tous les produits disponibles pour les Femmes

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

