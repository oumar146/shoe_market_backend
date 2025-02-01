require("dotenv").config();
const { v4: uuidv4 } = require("uuid");    

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

exports.createOrder = async (req, res, client) => {
    const { orders } = req.body;

    // Validation des champs obligatoires
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Aucune commande à traiter.",
        });
    }

    try {
        const reference = uuidv4(); // Générer une référence unique pour la commande

        // Insérer chaque commande dans la base de données
        for (const order of orders) {
            const { product_id, user_id, amount, unit_price, quantity } = order;

            // Vérifier que tous les champs obligatoires sont présents
            if (!product_id || !user_id || !amount ) {
                return res.status(400).json({
                    success: false,
                    message: "Tous les champs sont obligatoires : product_id, user_id, amount, quantity.",
                });
            }

            // Requête SQL pour insérer une nouvelle commande
            const query = {
                text: `
                    INSERT INTO orders (product_id, user_id, status_id, amount, quantity, created_at, reference, unit_price)
                    VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
                    RETURNING *;
                `,
                values: [product_id, user_id, 1, quantity*(parseInt(unit_price, 10)), quantity, reference, parseInt(unit_price, 10)], // Statut par défaut : 1 (en attente)
            };

            // Exécution de la requête
            await client.query(query);
        }

        // Réponse en cas de succès
        res.status(201).json({
            success: true,
            message: "Commandes créées avec succès.",
            reference, // Retourner la référence de la commande
        });
    } catch (error) {
        console.error("Erreur lors de la création des commandes :", error);
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la création des commandes.",
        });
    }
};

// exports.deleteOrder = async (req, res, client) => {
//     const { order_id } = req.body;

//     // Vérifier que l'ID de la commande est fourni
//     if (!order_id) {
//         return res.status(400).json({
//             success: false,
//             message: "L'ID de la commande est requis.",
//         });
//     }

//     try {
//         // Requête SQL pour supprimer la commande
//         const query = {
//             text: `DELETE FROM orders WHERE id = $1 RETURNING *;`,
//             values: [order_id],
//         };

//         // Exécution de la requête
//         const result = await client.query(query);

//         // Vérifier si la commande a bien été trouvée et supprimée
//         if (result.rowCount === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Commande non trouvée.",
//             });
//         }

//         // Réponse en cas de succès
//         res.status(200).json({
//             success: true,
//             message: "Commande supprimée avec succès.",
//             deletedOrder: result.rows[0], // Retourner les informations de la commande supprimée
//         });
//     } catch (error) {
//         console.error("Erreur lors de la suppression de la commande :", error);
//         res.status(500).json({
//             success: false,
//             message: "Une erreur est survenue lors de la suppression de la commande.",
//         });
//     }
// };