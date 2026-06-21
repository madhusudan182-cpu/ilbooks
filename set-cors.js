const { Storage } = require('@google-cloud/storage');

// ১. আপনার ফায়ারবেস স্টোরেজ বাকেটের নাম (কনসোলের এরর থেকে নেওয়া)
const bucketName = "bd-job-preparation-59801-7613b.firebasestorage.app";

const storage = new Storage();

async function configureBucketCors() {
  await storage.bucket(bucketName).setCorsConfiguration([
    {
      maxAgeSeconds: 3600,
      method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      origin: ['http://localhost:9002', 'http://localhost:3000'], // আপনার লোকাল পোর্টগুলো
      responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'X-Requested-With'],
    },
  ]);

  console.log(`CORS configuration successfully updated for ${bucketName}`);
}

configureBucketCors().catch(console.error);
