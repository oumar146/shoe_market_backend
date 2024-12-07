const AWS = require('aws-sdk');

// Configuration de S3 avec Supabase
const s3 = new AWS.S3({
  endpoint: 'https://your-s3-endpoint.supabase.co',  // Remplace par ton endpoint
  accessKeyId: process.env.SUPABASE_KEY,            // Ta clé d'accès (stockée dans les variables d'environnement)
  secretAccessKey: process.env.SUPABASE_SECRET_KEY,  // Ta clé secrète (stockée dans les variables d'environnement)
  region: 'us-east-1',                             // Région S3, tu peux vérifier celle de ton bucket
  signatureVersion: 'v4',                           // Version de signature pour l'authentification
});

// Fonction pour uploader un fichier dans Supabase via S3
const uploadToS3 = async (fileBuffer, fileName, bucketName) => {
  const params = {
    Bucket: bucketName, // Le nom de ton bucket
    Key: fileName,      // Le nom du fichier (il est préférable de donner un nom unique)
    Body: fileBuffer,   // Le contenu du fichier
    ACL: 'public-read', // Permet d'accéder publiquement au fichier
  };

  try {
    const data = await s3.upload(params).promise();
    return data;  // Retourne les informations sur le fichier uploadé
  } catch (error) {
    throw new Error('Erreur lors de l\'upload sur S3: ' + error.message);
  }
};

module.exports = uploadToS3;
