// const express = require("express");
// const router = express.Router();
// const {
//   newProduct,
//   getMyProducts,
//   getProducts,
//   sendConfirmationEmail,
//   getProductByReference,
//   deleteProduct,
//   updateProduct,
// } = require("../controllers/productCtrl");

// // Middleware pour l'authentification des utilisateurs
// const auth = require("../middleware/auth");
// // Middleware pour la gestion des fichiers (images)
// const multer = require("../middleware/multer-config");
// // Middleware pour renouveler le token d'authentification si nécessaire

// const client = require("../dataBase");

// // Routes pour les produits
// router.post(
//   "/new",
//   auth,
//   multer, // Gère le téléchargement de fichiers
//   (req, res, next) => newProductTest(req, res, next, client), // Créer un nouveau produit
//   (req, res) => sendConfirmationEmail(req, res, client) // Envoyer un email de confirmation après la création
// );

// router.delete(
//   "/delete",
//   multer,
//   auth,

//   (req, res) => deleteProduct(req, res, client) // Supprimer un produit
// );

// router.post(
//   "/my-offers",
//   auth,
//   (req, res) => getMyProducts(req, res, client) // Obtenir les produits de l'utilisateur connecté
// );

// router.get("/offers", (req, res) => getProducts(req, res, client)); // Obtenir tous les produits disponibles

// router.get("/:reference", (req, res) =>
//   getProductByReference(req, res, client)
// ); // Obtenir un produit par son identifiant (référence)

// router.put(
//   "/update",
//   auth,

//   multer,
//   (req, res) => updateProduct(req, res, client) // Mettre à jour un produit existant
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const multer = require("../middleware/multer-config");
const auth = require("../middleware/auth");
const client = require("../dataBase");
const { newProductTest, sendConfirmationEmail } = require("../controllers/productCtrl");

router.post(
  "/new",
  auth,
  multer,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucune image fournie." });
      }

      // Préparer les données pour Supabase
      const file = req.file;
      const uniqueName = `${Date.now()}-${file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from("images") // Remplace "images" par le nom de ton bucket
        .upload(uniqueName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        return res.status(500).json({ message: "Échec de l'upload d'image.", error });
      }

      // Générer l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(data.path);

      // Appeler la logique de création de produit
      await newProductTest(req, res, client, publicUrlData.publicUrl);

      // Envoyer un email de confirmation
      sendConfirmationEmail(req, res, client);

    } catch (err) {
      res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
  }
);

module.exports = router;
