exports.newCategory = async (req, res, client) => {
  try {
    // Inserer une nouvelle catégorie
    const query = {
      text: "INSERT INTO categories (name) VALUES ($1)",
      values: [req.body.name],
    };

    await client.query(query);
    res.status(201).json({ message: "category created successfully" });
  } catch (error) {
    console.error("Error insert new category :", error);
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
    // mettre à jour une categorie
    const query = {
      text: "UPDATE categories SET name = $1 WHERE name = $2",
      values: [req.body.newName, req.body.oldName],
    };

    const result = await client.query(query);
    // Si la catégorie n'est pas trouvée
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Category not found" });
    } else {
      res.status(200).json({ message: "Category updated successfully" });
    }
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

    await client.query(query);
    res.status(201).json({ message: "category deleted successfully" });
  } catch (error) {
    console.error(`Error deleted category (${req.body.name}) :`, error);
    res
      .status(500)
      .json({ error: `Error deleted category : ${req.body.name}` });
  }
};
