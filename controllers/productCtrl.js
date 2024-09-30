const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

exports.newProduct = async (req, res, next, client) => {
  try {
    const {
      name,
      description,
      creation_date,
      size,
      price,
      creator_id,
      category_name,
      email,
    } = req.body;

    const image_url = req.file
      ? `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
      : null;

    // Vérifier si la catégorie existe
    const categoryQuery = {
      text: "SELECT * FROM categories WHERE name = $1",
      values: [category_name],
    };
    const categoryResult = await client.query(categoryQuery);

    if (categoryResult.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Générer une référence unique pour le produit avec UUID
    const reference = uuidv4();

    // Insérer un nouveau produit avec la référence
    const productQuery = {
      text: "INSERT INTO products (name, description, creation_date, size, price, creator_id, category_name, image_url, reference) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      values: [
        name,
        description,
        creation_date,
        size,
        price,
        creator_id,
        category_name,
        image_url,
        reference,
      ],
    };

    const productResult = await client.query(productQuery);

    // Préparer l'objet de réponse
    const responseData = {
      message: "Produit crée avec succès",
      product: productResult.rows[0],
    };

    // Ajouter les informations nécessaires pour l'envoi de l'e-mail à destination de l'utilisateur
    req.product = productResult.rows[0];
    req.email = email;

    // res.status(201).json(responseData);
    next();
  } catch (error) {
    console.error("Erreur lors de l'ajout du produit", error);
    res.status(500).json({ error: "Erreur lors de l'ajout du produit" });
  }
};

exports.getMyProducts = async (req, res, client) => {
  try {
    const { user_id } = req.body;
    // Récupérer tous les produits d'un utilisateur
    const query = {
      text: "SELECT * FROM products WHERE creator_id = ($1)",
      values: [user_id],
    };
    const response = await client.query(query);
    const products = response.rows;
    res.status(200).json({ products });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des produits" });
  }
};

exports.getProducts = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
        SELECT 
          *, 
          users.first_name AS creator_name, 
          users.email AS creator_email 
        FROM products 
        JOIN users ON products.creator_id = users.id
      `,
    };

    const response = await client.query(query);
    const products = response.rows;
    res.status(200).json({ products });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des produits" });
  }
};

exports.updateProduct = async (req, res, client) => {
  try {
    const { product_id, name, description, size, price, category_name } =
      req.body;

    const image_url = req.file
      ? `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
      : null;
    // Vérifier si la catégorie existe
    const categoryQuery = {
      text: "SELECT * FROM categories WHERE name = $1",
      values: [category_name],
    };
    const categoryResult = await client.query(categoryQuery);

    if (categoryResult.rowCount === 0) {
      return res.status(404).json({ error: "Categorie non trouvée" });
    }

    // Mettre à jour le produit
    const productQuery = {
      text: `UPDATE products 
             SET name = $1, description = $2, size = $3, price = $4, 
                 category_name = $5, image_url = COALESCE($6, image_url)
             WHERE id = $7`,
      values: [
        name,
        description,
        size,
        price,
        category_name,
        image_url,
        product_id,
      ],
    };

    const result = await client.query(productQuery);

    // Préparer la réponse
    const responseData = {
      message:
        result.rowCount === 0 ? "Produit non trouvé" : "Produit mis à jour",
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    res.status(result.rowCount === 0 ? 404 : 200).json(responseData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du produit" });
  }
};

exports.deleteProduct = async (req, res, client) => {
  try {
    const { product_id: productId } = req.body;

    // Récupérer le chemin de l'image à partir de la base de données
    const fetchImagePathQuery = {
      text: "SELECT image_url FROM products WHERE id = $1",
      values: [productId],
    };
    const imageResult = await client.query(fetchImagePathQuery);

    if (imageResult.rowCount === 0) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    const imageUrl = imageResult.rows[0].image_url; // http://localhost:4100/images/nom_du_fichier.extension
    const relativeImagePath = imageUrl.replace("http://localhost:4100/", ""); // images/nom_du_fichier.extension

    // Supprimer le produit de la base de données
    const deleteProductQuery = {
      text: "DELETE FROM products WHERE id = $1",
      values: [productId],
    };
    const deleteResult = await client.query(deleteProductQuery);

    // Si le produit a été supprimé, supprimer l'image du serveur
    if (deleteResult.rowCount > 0 && relativeImagePath) {
      const baseDirPath = path.join(__dirname, "../"); // C:\PROJET_GITHUB\shoe_market_backend\
      const fullImagePath = path.join(baseDirPath, relativeImagePath); // C:\PROJET_GITHUB\shoe_market_backend\images/nom_du_fichier.extension

      fs.unlink(fullImagePath, (err) => {
        if (err) {
          console.error(
            "Erreur lors de la suppression du fichier image :",
            err
          );
        } else {
          console.log("Image supprimée avec succès :", fullImagePath);
        }
      });
    }

    // 4. Préparer la réponse
    const responseData = {
      message:
        deleteResult.rowCount === 0
          ? "Produit non trouvé"
          : "Produit et image associée supprimés avec succès",
    };

    // Ajouter un nouveau token à la réponse, s'il existe
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    // Définir le code de statut approprié
    res.status(deleteResult.rowCount === 0 ? 404 : 200).json(responseData);
  } catch (error) {
    console.error(
      `Erreur lors de la suppression du produit (${req.body.product_id}) :`,
      error
    );
    res.status(500).json({
      error: `Erreur lors de la suppression du produit numéro : ${req.body.product_id}`,
    });
  }
};

exports.sendConfirmationEmail = async (req, res) => {
  const { email } = req;

  const { name: productName, reference } = req.product;

  if (!email || !productName) {
    return res.status(400).json({ error: "Email or product name is missing" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: '"ShopMarket" <no-reply@shopmarket.com>',
      to: email,
      subject: `Confirmation de votre produit: ${productName}`,
      html: `
      <p>Bonjour,</p>
      <p>Votre produit <strong>"${productName}"</strong> est en cours de création.</p>
      <p>Vous pouvez consulter les détails du produit en cliquant sur le lien ci-dessous :</p>
      <p><a href="http://localhost:3000/offer/${reference}">Voir les détails du produit</a></p>
      <p>Merci pour votre confiance.</p>
    `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Confirmation email sent successfully" });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    res.status(500).json({ error: "Error sending confirmation email" });
  }
};

exports.getProductByReference = async (req, res, client) => {
  try {
    const { reference } = req.params;

    // Récupérer le produit et les informations du créateur
    const query = {
      text: `
        SELECT 
          products.*, 
          users.first_name AS creator_name, 
          users.email AS creator_email 
        FROM products 
        JOIN users ON products.creator_id = users.id 
        WHERE products.reference = $1
      `,
      values: [reference],
    };

    const response = await client.query(query);
    const product = response.rows[0];

    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    const responseData = {
      product,
    };

    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Erreur lors de la récupération du produit", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération du produit" });
  }
};
