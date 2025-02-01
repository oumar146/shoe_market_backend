const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

exports.newProduct = async (req, res, next, client, supabase) => {
  try {
    const {
      name,
      description,
      creation_date,
      gender_name,
      price,
      creator_id,
      category_name,
      email,
      sizes, // Liste des tailles à insérer
    } = req.body;

    console.log(req.body);

    let image_url = null;

    // Upload de l'image sur Supabase
    if (req.file) {
      try {
        const file = req.file;

        // Générer un nom unique pour le fichier
        const fileName = `${uuidv4()}-${file.originalname}`;
        const bucketName = "product-images";

        // Uploader l'image
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file.buffer, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          throw new Error(
            `Erreur lors de l'upload de l'image: ${error.message}`
          );
        }

        // Générer l'URL publique
        image_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;
      } catch (uploadError) {
        console.error("Erreur lors de l'upload de l'image:", uploadError);
        return res.status(500).json({ error: "Échec de l'upload de l'image" });
      }
    }

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
      text: "INSERT INTO products (name, description, creation_date, gender_name, price, creator_id, category_name, image_url, reference) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      values: [
        name,
        description,
        creation_date,
        gender_name,
        price,
        creator_id, // Assurez-vous que creator_id est correctement récupéré
        category_name,
        image_url,
        reference,
      ],
    };

    const productResult = await client.query(productQuery);
    const productId = productResult.rows[0].id;

    // Vérifier si des tailles sont spécifiées
    if (sizes && sizes.length > 0) {
      // Créer les requêtes pour insérer chaque taille pour ce produit
      const insertStockQueries = sizes.map((size) => {
        return {
          text: "INSERT INTO stock (product_id, size_fk, quantity) VALUES ($1, $2, 0)",
          values: [productId, size], // Utilisation de la taille directement comme valeur numérique
        };
      });

      // Exécuter toutes les requêtes d'insertion des tailles
      for (let query of insertStockQueries) {
        await client.query(query);
      }
    }

    // Ajouter les informations nécessaires pour l'envoi de l'e-mail à destination de l'utilisateur
    req.product = productResult.rows[0];
    req.email = email;

    // Passer au middleware suivant
    next();
  } catch (error) {
    console.error("Erreur lors de l'ajout du produit:", error);
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

exports.getSizes = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
        SELECT 
          size
        FROM sizes 
      `,
    };

    const response = await client.query(query);
    const sizes = response.rows.map((row) => row.size); // Extraire seulement les tailles
    res.status(200).json({ sizes });
  } catch (error) {
    console.error("Erreur lors de la récupération des tailles", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des tailles" });
  }
};

exports.getGenders = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
        SELECT 
          *
        FROM gender 
      `,
    };

    const response = await client.query(query);
    const genders = response.rows;
    const tabgenders = genders.map((gender) => gender.gender_name);
    res.status(200).json({ genders: tabgenders });
  } catch (error) {
    console.error("Erreur lors de la récupération des genres", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des genres" });
  }
};

exports.getStockProducts = async (req, res, client) => {
  try {
    // Récupérer tous les produits avec les informations sur le stock
    const query = {
      text: `
        SELECT 
          products.id AS product_id, 
          products.name AS product_name, 
          products.description, 
          products.creation_date, 
          products.price, 
          products.category_name, 
          products.image_url, 
          products.gender_name,
          products.reference, 
          users.id AS creator_id, 
          users.first_name AS creator_name, 
          users.email AS creator_email,
          stock.size_fk, 
          stock.quantity
        FROM products 
        JOIN users ON products.creator_id = users.id
        LEFT JOIN stock ON products.id = stock.product_id
      `,
    };

    const response = await client.query(query);
    const products = response.rows;

    // Organiser les tailles et quantités dans un tableau d'objets
    const formattedProducts = products.reduce((acc, product) => {
      // Vérifier si le produit existe déjà dans l'accumulateur
      let existingProduct = acc.find(
        (p) => p.product_id === product.product_id
      );
      if (!existingProduct) {
        // Si le produit n'existe pas, ajouter une nouvelle entrée
        existingProduct = {
          ...product,
          stock: [], // Créer un tableau de stock vide
        };
        acc.push(existingProduct);
      }

      // Ajouter un objet stock avec la taille et la quantité associée
      existingProduct.stock.push({
        size: product.size_fk,
        quantity: product.quantity || 0, // S'assurer que quantity est défini même si elle est nulle
      });

      return acc;
    }, []);

    // Supprimer les informations `size_fk` et `quantity` du produit principal
    const cleanedProducts = formattedProducts.map((product) => {
      const { size_fk, quantity, ...productWithoutStock } = product;
      return productWithoutStock;
    });

    res.status(200).json({ products: cleanedProducts });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des produits" });
  }
};

exports.updateStockQuantity = async (req, res, client) => {
  try {
    const { productId, size_fk, quantity } = req.body;
    console.log(req.body);

    // Vérifier que tous les champs requis sont présents
    if (!productId || !size_fk || quantity === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Mise à jour de la quantité dans le stock
    const query = {
      text: `
        UPDATE stock
        SET quantity = $1
        WHERE product_id = $2 AND size_fk = $3
        RETURNING *;
      `,
      values: [quantity, productId, size_fk],
    };

    const result = await client.query(query);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Stock entry not found" });
    }

    return res.status(200).json({
      message: "Stock quantity updated successfully",
      stock: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating stock quantity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProducts = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
 SELECT 
  id AS product_id, 
  name AS product_name, 
  description, 
  creation_date, 
  price, 
  category_name, 
  image_url, 
  gender_name,
  reference
FROM products;
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

exports.getMenProducts = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
        SELECT 
          products.id AS product_id, 
          products.name AS product_name, 
          products.description, 
          products.creation_date, 
          products.price, 
          products.category_name, 
          products.image_url, 
          products.gender_name,
          products.reference, 
          users.id AS creator_id, 
          users.first_name AS creator_name, 
          users.email AS creator_email 
        FROM products 
        JOIN users ON products.creator_id = users.id
        WHERE products.gender_name IN ('Homme', 'Unisex')
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

exports.getWomenProducts = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
        SELECT 
          products.id AS product_id, 
          products.name AS product_name, 
          products.description, 
          products.creation_date, 
          products.price, 
          products.category_name, 
          products.image_url, 
          products.gender_name,
          products.reference, 
          users.id AS creator_id, 
          users.first_name AS creator_name, 
          users.email AS creator_email 
        FROM products 
        JOIN users ON products.creator_id = users.id
        WHERE products.gender_name IN ('Femme', 'Unisex')
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

exports.getUnisexProducts = async (req, res, client) => {
  try {
    // Récupérer tous les produits
    const query = {
      text: `
        SELECT 
          products.id AS product_id, 
          products.name AS product_name, 
          products.description, 
          products.creation_date, 
          products.price, 
          products.category_name, 
          products.image_url, 
          products.gender_name,
          products.reference, 
          users.id AS creator_id, 
          users.first_name AS creator_name, 
          users.email AS creator_email 
        FROM products 
        JOIN users ON products.creator_id = users.id
        WHERE products.gender_name = 'Unisex'
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

exports.updateProduct = async (req, res, client, supabase) => {
  try {
    const { product_id, name, description, gender_name, price, category_name } =
      req.body;
    let image_url = null;
    console.log(gender_name);
    // Si une nouvelle image est téléchargée, l'uploader sur Supabase
    if (req.file) {
      const file = req.file;
      const fileName = `${uuidv4()}-${file.originalname}`;
      const bucketName = "product-images";

      // Uploader l'image sur Supabase
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file.buffer, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
      }

      // Générer l'URL publique de l'image
      image_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;

      // Supprimer l'ancienne image si nécessaire
      const fetchOldImageQuery = {
        text: "SELECT image_url FROM products WHERE id = $1",
        values: [product_id],
      };
      const oldImageResult = await client.query(fetchOldImageQuery);

      if (oldImageResult.rowCount > 0) {
        const oldImageUrl = oldImageResult.rows[0].image_url;
        const oldFileName = oldImageUrl.split(
          `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/`
        )[1];

        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([oldFileName]);

        if (deleteError) {
          console.error(
            "Erreur lors de la suppression de l'ancienne image sur Supabase :",
            deleteError
          );
        } else {
          console.log(
            "Ancienne image supprimée avec succès sur Supabase :",
            oldFileName
          );
        }
      }
    }

    // Vérifier si la catégorie existe
    const categoryQuery = {
      text: "SELECT * FROM categories WHERE name = $1",
      values: [category_name],
    };
    const categoryResult = await client.query(categoryQuery);

    if (categoryResult.rowCount === 0) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }

    // Mettre à jour le produit dans la base de données
    const productQuery = {
      text: `UPDATE products 
             SET name = $1, description = $2, gender_name = $3, price = $4, 
                 category_name = $5, image_url = COALESCE($6, image_url)
             WHERE id = $7`,
      values: [
        name,
        description,
        gender_name,
        price,
        category_name,
        image_url, // L'URL de l'image est mise à jour avec celle de Supabase si une nouvelle image a été téléchargée
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

exports.deleteProduct = async (req, res, client, supabase) => {
  try {
    const { product_id: productId } = req.body;

    // Récupérer l'URL de l'image à partir de la base de données
    const fetchImagePathQuery = {
      text: "SELECT image_url FROM products WHERE id = $1",
      values: [productId],
    };
    const imageResult = await client.query(fetchImagePathQuery);

    if (imageResult.rowCount === 0) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }

    const imageUrl = imageResult.rows[0].image_url;

    // Supprimer d'abord les entrées associées dans la table stock
    const deleteStockQuery = {
      text: "DELETE FROM stock WHERE product_id = $1",
      values: [productId],
    };
    await client.query(deleteStockQuery);

    // Supprimer le produit de la base de données
    const deleteProductQuery = {
      text: "DELETE FROM products WHERE id = $1",
      values: [productId],
    };
    const deleteResult = await client.query(deleteProductQuery);

    // Supprimer l'image de Supabase si le produit a été supprimé
    if (deleteResult.rowCount > 0 && imageUrl) {
      const bucketName = "product-images"; // Nom du bucket Supabase
      const fileName = imageUrl.split(
        `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/`
      )[1];

      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (deleteError) {
        console.error(
          "Erreur lors de la suppression de l'image sur Supabase :",
          deleteError
        );
      } else {
        console.log("Image supprimée avec succès sur Supabase :", fileName);
      }
    }

    // Préparer la réponse
    const responseData = {
      message:
        deleteResult.rowCount === 0
          ? "Produit non trouvé"
          : "Produit, stock et image associés supprimés avec succès",
    };

    // Ajouter un nouveau token à la réponse, s'il existe
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

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
