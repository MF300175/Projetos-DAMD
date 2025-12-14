const express = require('express');
const router = express.Router();
const multer = require('multer');
const mediaController = require('../controllers/mediaController');

// Configurar multer para processar multipart/form-data
// Armazenar em memória (buffer) para enviar direto ao S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos.'), false);
    }
  },
});

/**
 * POST /api/media/upload
 * Recebe imagem em Base64 (JSON) e envia para o S3 (LocalStack)
 */
router.post('/upload', mediaController.uploadImage);

/**
 * POST /api/media/upload-multipart
 * Recebe imagem via Multipart/form-data e envia para o S3 (LocalStack)
 * Campo do form: "image"
 */
router.post('/upload-multipart', upload.single('image'), mediaController.uploadImageMultipart);

module.exports = router;


