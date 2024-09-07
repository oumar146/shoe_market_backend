const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);

    // Vérifier le temps restant avant l'expiration du token
    const currentTime = Math.floor(Date.now() / 1000); // Temps actuel en secondes
    const expirationTime = decodedToken.exp;
    if (expirationTime - currentTime <= 300) {
      // Si moins de 5 minutes restantes
      // Générer un nouveau token
      const newToken = jwt.sign(
        { userEmail: decodedToken.userEmail },
        process.env.TOKEN_KEY,
        { expiresIn: "1h" } // Définir la durée de validité du nouveau token
      );
      // Stocker le nouveau token dans res.locals
      res.locals.newToken = newToken;
    }

    req.auth = {
      userEmail: decodedToken.userEmail,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
