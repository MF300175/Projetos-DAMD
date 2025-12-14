const { s3, bucketName } = require('../config/aws');

/**
 * POST /api/media/upload
 * Recebe uma imagem em Base64 (JSON) e salva no S3 (LocalStack)
 */
async function uploadImage(req, res, next) {
  try {
    const { imageBase64, fileName, contentType, taskId } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Campo imageBase64 é obrigatório e deve ser string Base64.',
      });
    }

    let base64Data = imageBase64;
    // Remover prefixo data URL se presente
    const commaIndex = imageBase64.indexOf(',');
    if (commaIndex !== -1) {
      base64Data = imageBase64.substring(commaIndex + 1);
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Dados de imagem inválidos.',
      });
    }

    const now = Date.now();
    const safeFileName = fileName && typeof fileName === 'string'
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `task_${now}.jpg`;

    const key = `tasks/${safeFileName}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'image/jpeg',
    };

    await s3.putObject(params).promise();

    const location = `s3://${bucketName}/${key}`;

    return res.status(201).json({
      message: 'Imagem enviada com sucesso para o S3 (LocalStack).',
      bucket: bucketName,
      key,
      location,
      taskId: taskId || null,
    });
  } catch (err) {
    // Log mais detalhado para troubleshooting em sala
    console.error('Erro ao fazer upload para S3 (LocalStack):', err);
    next(err);
  }
}

/**
 * POST /api/media/upload-multipart
 * Recebe uma imagem via Multipart/form-data e salva no S3 (LocalStack)
 */
async function uploadImageMultipart(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Arquivo de imagem é obrigatório. Use o campo "image" no form-data.',
      });
    }

    const file = req.file;
    const { taskId } = req.body || {};

    if (!file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Dados de imagem inválidos.',
      });
    }

    const now = Date.now();
    const originalName = file.originalname || 'image.jpg';
    const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalFileName = safeFileName || `task_${now}.jpg`;

    const key = `tasks/${finalFileName}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'image/jpeg',
    };

    await s3.putObject(params).promise();

    const location = `s3://${bucketName}/${key}`;

    return res.status(201).json({
      message: 'Imagem enviada com sucesso para o S3 (LocalStack) via Multipart.',
      bucket: bucketName,
      key,
      location,
      taskId: taskId || null,
      size: file.size,
      contentType: file.mimetype,
    });
  } catch (err) {
    console.error('Erro ao fazer upload para S3 (LocalStack) via Multipart:', err);
    next(err);
  }
}

module.exports = {
  uploadImage,
  uploadImageMultipart,
};


