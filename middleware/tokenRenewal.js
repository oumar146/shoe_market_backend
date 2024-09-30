const jwt = require("jsonwebtoken");
require("dotenv").config();

const tokenRenewal = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Extraire le token des en-têtes
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY); // Vérifier le token

    const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    const expirationTime = decodedToken.exp; // Temps d'expiration du token

    if (expirationTime - currentTime <= 300) {
      // Moins de 5 minutes restantes
      const newToken = jwt.sign(
        { userEmail: decodedToken.userEmail },
        process.env.TOKEN_KEY,
        { expiresIn: "1h" } // Nouveau token valide 1h
      );
      res.locals.newToken = newToken; // Stocker le nouveau token
    }
    // Ajouter les informations de l'utilisateur à l'objet req pour une utilisation ultérieure
    req.auth = { userEmail: decodedToken.userEmail };
    next(); // Passer au prochain middleware
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = tokenRenewal; // Exporter le middleware
