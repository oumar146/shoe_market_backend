const multer = require("multer");

const TYPES_DE_FICHIERS = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  // Déterminer le répertoire où le fichier sera stocké.
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  // Génèrer le nom du fichier qui sera enregistré sur le serveur
  filename: (req, file, callback) => {
    // Supprime l'extension et remplace les espaces par des underscores
    const name = file.originalname.split(" ").join("_").split(".")[0];
    const extension = TYPES_DE_FICHIERS[file.mimetype];
    callback(null, name + Date.now() + "." + extension);
  },
});

module.exports = multer({ storage: storage }).single("image");
