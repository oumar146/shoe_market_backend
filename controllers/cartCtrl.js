require("dotenv").config();

// Ajouter un produit au panier
exports.addToCart = async (req, res, client) => {
  try {
    const { user_id, product_id, quantity, size } = req.body;
    console.log(quantity)

    if (!user_id || !product_id || quantity <= 0) {
      return res.status(400).json({ error: "user_id, product_id et quantity valide sont requis." });
    }

    const cartQuery = {
      text: "INSERT INTO cart (user_id, product_id, quantity, size_fk) VALUES ($1, $2, $3, $4)",
      values: [user_id, product_id, quantity, size],
    };

    await client.query(cartQuery);
    res.status(201).json({ message: "Produit ajouté au panier avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de l'ajout au panier." });
  }
};

// Récupérer tous les produits du panier d'un utilisateur
exports.getCart = async (req, res, client) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "L'ID de l'utilisateur est requis." });
    }

    const query = {
      text: "SELECT id, product_id, quantity, size_fk as size FROM cart WHERE user_id = $1",
      values: [user_id],
    };

    const response = await client.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la récupération du panier." });
  }
};

// Supprimer un produit du panier
exports.removeFromCart = async (req, res, client) => {
  try {
    const { user_id, cart_id } = req.body;

    const query = {
      text: "DELETE FROM cart WHERE user_id = $1 AND id = $2",
      values: [user_id, cart_id],
    };

    const result = await client.query(query);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Produit non trouvé dans le panier." });
    }

    res.status(200).json({ message: "Produit retiré du panier avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la suppression du produit du panier." });
  }
};

// Vérifier si un produit est déjà dans le panier
exports.checkCartStatus = async (req, res, client) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ error: "user_id et product_id sont requis." });
    }

    const query = {
      text: "SELECT * FROM cart WHERE user_id = $1 AND product_id = $2",
      values: [user_id, product_id],
    };

    const response = await client.query(query);
    res.status(200).json({ inCart: response.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la vérification du panier." });
  }
};
