const multer = require("multer");

const TYPES_DE_FICHIERS = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// Utilisation du stockage en mémoire
const storage = multer.memoryStorage();


module.exports = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (!TYPES_DE_FICHIERS[file.mimetype]) {
      return callback(new Error("Seules les images JPG, JPEG et PNG sont acceptées"));
    }
    callback(null, true);
  },
}).single("image");

