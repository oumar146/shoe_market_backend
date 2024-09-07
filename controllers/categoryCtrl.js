exports.newCategory = async (req, res, client) => {
  try {
    // Insérer une nouvelle catégorie
    const query = {
      text: "INSERT INTO categories (name) VALUES ($1)",
      values: [req.body.name],
    };

    await client.query(query);

    // Préparer la réponse
    const responseData = {
      message: "Category created successfully",
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error inserting new category:", error);
    res.status(500).json({ error: "Error inserting category" });
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
    console.error("Error get all categories :", error);
    res.status(500).json({ error: "Error get all categories" });
  }
};

exports.updateCategory = async (req, res, client) => {
  try {
    // Mettre à jour une catégorie
    const query = {
      text: "UPDATE categories SET name = $1 WHERE name = $2",
      values: [req.body.newName, req.body.oldName],
    };

    // Exécuter la requête de mise à jour
    const result = await client.query(query);

    // Préparer la réponse
    const responseData = {
      message:
        result.rowCount === 0
          ? "Category not found"
          : "Category updated successfully",
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    // Définir le code de statut approprié
    res.status(result.rowCount === 0 ? 404 : 200).json(responseData);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Error updating category" });
  }
};

exports.deleteCategory = async (req, res, client) => {
  try {
    // Supprimer une catégorie
    const query = {
      text: "DELETE FROM categories WHERE name = $1",
      values: [req.body.name],
    };

    // Exécuter la requête de suppression
    const result = await client.query(query);

    // Préparer la réponse
    const responseData = {
      message:
        result.rowCount === 0
          ? "Category not found"
          : "Category deleted successfully",
    };

    // Ajouter le nouveau token à la réponse si disponible
    if (res.locals.newToken) {
      responseData.token = res.locals.newToken;
    }

    // Définir le code de statut approprié
    res.status(result.rowCount === 0 ? 404 : 200).json(responseData);
  } catch (error) {
    console.error(`Error deleting category (${req.body.name}) :`, error);
    res
      .status(500)
      .json({ error: `Error deleting category : ${req.body.name}` });
  }
};
