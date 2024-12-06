const express = require("express");
const app = express();
const path = require("path"); // Gérer les chemins de fichiers
const bodyParser = require("body-parser");
const categoryRoutes = require("./router/categoryRoutes");
const userRoutes = require("./router/userRoutes");
const productRoutes = require("./router/productRoutes");

// Activer la lecture des données JSON
app.use(bodyParser.json());

// Autoriser la communication avec d'autres serveurs
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Routes pour utilisateurs, catégories et produits
// app.use("/user", userRoutes);
// app.use("/category", categoryRoutes);
// app.use("/product", productRoutes);

// // Servir les images depuis le dossier images
// app.use("/images", express.static(path.join(__dirname, "./images")));
app.get('/', (req, res) => {
  res.send('Bienvenue sur mon API Node.js!');
});

module.exports = app;
