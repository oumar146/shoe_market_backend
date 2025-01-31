require("dotenv").config();

// Ajouter un produit aux favoris
exports.addFavourite = async (req, res, client) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ error: "user_id et product_id sont requis." });
    }

    const favouriteQuery = {
      text: "INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)",
      values: [user_id, product_id],
    };

    await client.query(favouriteQuery);
    res.status(201).json({ message: "Produit ajouté aux favoris avec succès." });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ error: "Ce favori existe déjà." });
    }
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du favori." });
  }
};

// Récupérer tous les produits favoris d'un utilisateur
exports.getFavourites = async (req, res, client) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "L'ID de l'utilisateur est requis." });
    }

    const query = {
      text: "SELECT product_id FROM favorites WHERE user_id = $1",
      values: [user_id],
    };

    const response = await client.query(query);
    const favourites = response.rows.map(row => row.product_id); // Extraction des IDs

    if (favourites.length === 0) {
      return res.status(404).json({ message: "Aucun favori trouvé." });
    }

    res.status(200).json(favourites); // Retourne un tableau simple d'IDs
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la récupération des favoris." });
  }
};


// Supprimer un produit des favoris
exports.deleteFavourite = async (req, res, client) => {
  try {
    const { user_id, product_id } = req.body;

    const query = {
      text: "DELETE FROM favorites WHERE user_id = $1 AND product_id = $2",
      values: [user_id, product_id],
    };

    const result = await client.query(query);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Favori non trouvé." });
    }

    res.status(200).json({ message: "Produit retiré des favoris avec succès." });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la suppression du favori." });
  }
};

// Vérifier si un produit est déjà en favori
exports.checkFavouriteStatus = async (req, res, client) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ error: "user_id et product_id sont requis." });
    }

    const query = {
      text: "SELECT * FROM favorites WHERE user_id = $1 AND product_id = $2",
      values: [user_id, product_id],
    };

    const response = await client.query(query);
    res.status(200).json({ isFavourite: response.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur lors de la vérification du favori." });
  }
};
