exports.newCategory = async (req, res, client) => {
  try {
    const { name } = req.body;

    // Insérer une nouvelle catégorie
    const query = {
      text: "INSERT INTO categories (name) VALUES ($1)",
      values: [name],
    };

    await client.query(query);

    // Préparer la réponse
    const responseData = {
      message: "Catégorie créée avec succès",
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error(
      "Erreur lors de l'insertion de la nouvelle catégorie :",
      error
    );
    res
      .status(500)
      .json({ error: "Erreur lors de l'insertion de la catégorie" });
  }
};

exports.getAllCategory = async (req, res, client) => {
  try {
    // Récupérer toutes les catégories
    const query = { text: "SELECT * FROM categories" };
    const response = await client.query(query);
    const categories = response.rows;
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des catégories" });
  }
};

exports.updateCategory = async (req, res, client) => {
  try {
    const { oldName, newName } = req.body;
    console.log("oldName :", oldName, "newName :", newName);

    // Démarrer une transaction
    await client.query("BEGIN");

    // Ajouter la nouvelle catégorie si elle n'existe pas déjà
    const addCategoryResult = await client.query({
      text: "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      values: [newName],
    });

    if (addCategoryResult.rowCount === 0) {
      console.log("La catégorie existe déjà");
    }

    // Mettre à jour les produits pour utiliser la nouvelle catégorie
    const updateProductsResult = await client.query({
      text: "UPDATE products SET category_name = $1 WHERE category_name = $2",
      values: [newName, oldName],
    });

    // Supprimer l'ancienne catégorie
    const deleteOldCategoryResult = await client.query({
      text: "DELETE FROM categories WHERE name = $1",
      values: [oldName],
    });

    // Valider la transaction
    await client.query("COMMIT");

    // Préparer la réponse
    const responseData = {
      message: "Catégorie mise à jour avec succès",
      details: {
        productsUpdated: updateProductsResult.rowCount,
        oldCategoryDeleted: deleteOldCategoryResult.rowCount > 0,
      },
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    // Envoyer la réponse
    res.status(200).json(responseData);
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await client.query("ROLLBACK");
    console.error("Erreur lors de la mise à jour de la catégorie :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la catégorie" });
  }
};

exports.deleteCategory = async (req, res, client) => {
  try {
    const { name } = req.body;
    console.log(req.body);

    // Supprimer une catégorie
    const query = {
      text: "DELETE FROM categories WHERE name = $1",
      values: [name],
    };

    // Exécuter la requête de suppression
    const result = await client.query(query);

    // Préparer la réponse
    const responseData = {
      message:
        result.rowCount === 0
          ? "Catégorie non trouvée"
          : "Catégorie supprimée avec succès",
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    // Définir le code de statut approprié
    res.status(result.rowCount === 0 ? 404 : 200).json(responseData);
  } catch (error) {
    console.error(
      `Erreur lors de la suppression de la catégorie (${req.body.name}) :`,
      error
    );
    res.status(500).json({
      error: `Erreur lors de la suppression de la catégorie : ${req.body.name}`,
    });
  }
};
