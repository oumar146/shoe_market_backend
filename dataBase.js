const { Client } = require("pg");
require("dotenv").config();

// Création de la chaîne de connexion à partir des variables d'environnement
const client = new Client({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

// Connexion à la base de données
client.connect((err) => {
  if (err) {
    console.error("Error connecting to the database", err.stack);
  } else {
    console.log("Connected to the database");
  }
});

module.exports = client;
