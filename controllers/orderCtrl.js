require("dotenv").config();

exports.getAllOrders = async (req, res, client) => {
    const query = `
SELECT 
    orders.id AS order_id,
    orders.user_id,
    users.email AS user_email,
    users.phone AS user_phone,
    products.id AS product_id,
    products.name AS product_name, 
    products.price AS product_price,
    products.image_url AS product_image,
    products.category_name,
    orders.quantity,
    orders.amount AS order_total_amount,
    order_statuses.name AS order_status,
    orders.created_at
FROM 
    orders
JOIN 
    users ON orders.user_id = users.id
JOIN 
    products ON orders.product_id = products.id
JOIN 
    order_statuses ON orders.status_id = order_statuses.id 
ORDER BY 
    orders.created_at DESC;
    `;

    try {
        const results = await client.query(query);

        // Reformater la date dans les résultats
        const formattedOrders = results.rows.map((order) => ({
            ...order,
            created_at: new Date(order.created_at).toLocaleDateString("fr-FR"), 
            amount : order.product_price * order.quantity
        }));

        res.status(200).json({
            success: true,
            orders: formattedOrders,
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des commandes :", error);
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la récupération des commandes.",
        });
    }
};


exports.getAllStatus= async (req, res, client) => {
    try {
      // Récupérer toutes les catégories
      const query = { text: "SELECT * FROM order_statuses" };
      const response = await client.query(query);
      const status = response.rows;
      res.status(200).json({ status });
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des catégories" });
    }
  };
  
  exports.updateOrderStatus = async (req, res, client) => {
    const { order_id, status_id } = req.body;
    console.log(order_id, status_id)
    if (!order_id || !status_id) {
        return res.status(400).json({
            success: false,
            message: "Les informations sont manquantes. Veuillez fournir l'ID de la commande et le nouvel ID de statut.",
        });
    }

    try {
        // Mettre à jour le statut de la commande
        const query = {
            text: `UPDATE orders SET status_id = $1 WHERE id = $2 RETURNING *`,
            values: [status_id, order_id],
        };

        const result = await client.query(query);

        // Vérifier si la commande a bien été trouvée et mise à jour
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Commande non trouvée",
            });
        }

        res.status(200).json({
            success: true,
            message: "Statut de la commande mis à jour avec succès.",
            updatedOrder: result.rows[0], // Retourner les informations mises à jour de la commande
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du statut de la commande :", error);
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la mise à jour du statut de la commande.",
        });
    }
};
