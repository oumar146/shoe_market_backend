const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, client) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // Vérifier si l'email existe déjà
    const checkEmailQuery = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };
    const emailResult = await client.query(checkEmailQuery);

    if (emailResult.rowCount > 0) {
      // L'email est déjà utilisé
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hachage du mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Création d'un nouveau utilisateur
    const query = {
      text: "INSERT INTO users(first_name, last_name, email, password) VALUES ($1, $2, $3, $4)",
      values: [first_name, last_name, email, hashedPassword],
    };
    await client.query(query);

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    console.error("Erreur d'inscription :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'inscription de l'utilisateur" });
  }
};

exports.login = async (req, res, client) => {
  try {
    const { email, password } = req.body;
    // Rechercher l'utilisateur
    const query = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    };
    const result = await client.query(query);

    if (result.rows.length === 0) {
      // Si l'utilisateur n'est pas trouvé
      return res.status(404).json({ error: "Email invalide" });
    }

    const user = result.rows[0];
    // Comparer le mot de passe fourni avec le mot de passe haché en base de données
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      // Si le mot de passe n'est pas valide
      return res.status(404).json({ error: "Mot de passe invalide" });
    }

    // Si l'utilisateur est trouvé et le mot de passe est correct
    res.status(200).json({
      token: jwt.sign({ userEmail: user.email }, process.env.TOKEN_KEY, {
        expiresIn: "1h",
      }),
      user,
    });
  } catch (error) {
    console.error("Erreur de connexion :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

exports.tokenCheck = async (req, res, client) => {
  try {
    const userEmail = req.auth.userEmail;

    // Requête pour obtenir les informations de l'utilisateur à partir de son email
    const query = {
      text: "SELECT * FROM users WHERE email = $1",
      values: [userEmail],
    };

    const result = await client.query(query);

    if (result.rows.length === 0) {
      // Si l'utilisateur n'est pas trouvé
      return res.status(404).json({ message: "User not found" });
    }

    const userInfo = result.rows[0];

    if (res.locals.newToken) {
      // Si un nouveau token a été généré, l'envoyer dans la réponse
      res.status(200).json({
        message: "Nouveau token",
        newToken: res.locals.newToken,
        user: userInfo,
      });
    } else {
      res.status(200).json({ message: "Le token est valide", user: userInfo });
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
