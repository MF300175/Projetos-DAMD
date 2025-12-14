const AWS = require('aws-sdk');

const region = process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
const bucketName = process.env.AWS_S3_BUCKET || 'shopping-images';

const s3 = new AWS.S3({
  region,
  endpoint,
  s3ForcePathStyle: true,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
});

module.exports = {
  s3,
  bucketName,
};


