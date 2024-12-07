// const multer = require("multer");

// const TYPES_DE_FICHIERS = {
//   "image/jpg": "jpg",
//   "image/jpeg": "jpg",
//   "image/png": "png",
// };

// const storage = multer.diskStorage({
//   // Déterminer le répertoire où le fichier sera stocké.
//   destination: (req, file, callback) => {
//     callback(null, "images");
//   },
//   // Génèrer le nom du fichier qui sera enregistré sur le serveur
//   filename: (req, file, callback) => {
//     // Supprime l'extension et remplace les espaces par des underscores
//     const name = file.originalname.split(" ").join("_").split(".")[0];
//     const extension = TYPES_DE_FICHIERS[file.mimetype];
//     callback(null, name + Date.now() + "." + extension);
//   },
// });

// module.exports = multer({ storage: storage }).single("image");

const multer = require("multer");
const supabase = require("../supabase"); // Importer la configuration Supabase

const uploadToSupabase = async (file) => {
  const { data, error } = await supabase.storage
    .from("produ-images")
    .upload(`images/${Date.now()}_${file.originalname}`, file.buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (error) throw error;

  const { publicUrl } = supabase.storage.from("product-images").getPublicUrl(data.path);
  return publicUrl;
};

const storage = multer.memoryStorage(); // Stockage en mémoire pour Multer

const multerConfig = multer({ storage }).single("image");

const uploadMiddleware = (req, res, next) => {
  multerConfig(req, res, async (err) => {
    if (err) return res.status(400).json({ error: "Erreur lors de l'upload" });

    try {
      const publicUrl = await uploadToSupabase(req.file);
      req.fileUrl = publicUrl; // Enregistrer l'URL de l'image dans la requête
      next();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'upload sur Supabase" });
    }
  });
};

module.exports = uploadMiddleware;
