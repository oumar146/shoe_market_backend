const jwt = require("jsonwebtoken");

// Middleware pour vérifier le token d'authentification
const verifyToken = (req, res, next) => {
  try {
    // Extraire le token des en-têtes de la requête
    const token = req.headers.authorization.split(" ")[1];

    // Vérifier le token
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);

    // Ajouter les informations de l'utilisateur à l'objet req pour une utilisation ultérieure
    req.auth = {
      userEmail: decodedToken.userEmail, // Stocker l'email de l'utilisateur décodé à partir du token
    };

    next(); // Passer au middleware suivant si la vérification est réussie
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = verifyToken;
