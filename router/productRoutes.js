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
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const uploadToS3 = require("../uploadS3"); // Importer la fonction d'upload S3

router.post(
  "/new",
  auth,
  multer,  // Middleware pour gérer le téléchargement de fichiers
  async (req, res) => {
    try {
      const { file } = req;  // Le fichier téléchargé via multer
      const fileBuffer = file.buffer;  // Le contenu du fichier
      const fileName = `${file.originalname.split(' ').join('_')}-${Date.now()}`;  // Créer un nom unique pour le fichier
      const bucketName = 'produ-images';  // Ton bucket Supabase

      // Upload du fichier dans Supabase via S3
      const uploadResult = await uploadToS3(fileBuffer, fileName, bucketName);

      // Retourner l'URL du fichier téléchargé ou toute autre donnée nécessaire
      res.status(200).json({ message: 'Fichier téléchargé avec succès', data: uploadResult });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      res.status(500).json({ error: error.message });
    }
  },
  (req, res) => sendConfirmationEmail(req, res, client)  // Envoi de l'email de confirmation après la création
);

module.exports = router;
