const express = require("express");
const router = express.Router();
// const multer = require("../middleware/multer-config");
const supabase = require("../supabaseClient");

const {
  newProduct,
  getMyProducts,
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
  auth,

  (req, res) => deleteProduct(req, res, client, supabase) // Supprimer un produit
);

router.post(
  "/my-offers",
  // auth,
  (req, res) => getMyProducts(req, res, client) // Obtenir les produits de l'utilisateur connecté
);

router.get("/offers", (req, res) => getProducts(req, res, client)); // Obtenir tous les produits disponibles

router.get("/:reference", (req, res) =>
  getProductByReference(req, res, client)
); // Obtenir un produit par son identifiant (référence)

router.put(
  "/update",
  auth,

  multer,
  (req, res) => updateProduct(req, res, client, supabase) // Mettre à jour un produit existant
);

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const multer = require("../middleware/multer-config");
// const supabase = require("../supabaseClient");
// const { generateFileName } = require("../middleware/multer-config");

// router.post("/new", multer, async (req, res) => {
//   try {
//     const file = req.file;
//     if (!file) {
//       throw new Error("Aucun fichier trouvé");
//     }

//     // Génère un nom de fichier unique et propre
//     const fileName = generateFileName(file);
//     const bucketName = "product-images";
//     // Upload vers Supabase
//     const { data, error } = await supabase.storage
//       .from(bucketName)
//       .upload(fileName, file.buffer, {
//         cacheControl: "3600",
//         upsert: true,
//       });

//     if (error) {
//       throw new Error(error.message);
//     }

//     // URL publique
//     const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;

//     res.status(200).json({
//       message: "Fichier téléchargé avec succès",
//       fileUrl,
//     });
//   } catch (error) {
//     console.error("Erreur lors de l'upload de l'image:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;
