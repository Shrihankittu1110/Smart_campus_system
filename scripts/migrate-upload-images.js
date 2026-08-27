const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('../backend/node_modules/mongoose');

require('../backend/node_modules/dotenv').config({
  path: path.join(__dirname, '..', 'backend', '.env'),
});

const Canteen = require('../backend/models/Canteen');
const Meal = require('../backend/models/Meal');

const uploadsRoot = path.join(__dirname, '..', 'backend', 'uploads');

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const toUploadPath = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('data:') || value.startsWith('http')) return null;

  const normalized = value.replaceAll('\\', '/');
  const marker = '/uploads/';
  const index = normalized.indexOf(marker);
  if (index === -1) return null;

  return normalized.slice(index + marker.length);
};

const imageToDataUrl = (imageValue) => {
  const uploadPath = toUploadPath(imageValue);
  if (!uploadPath) return null;

  const filePath = path.join(uploadsRoot, ...uploadPath.split('/'));
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file: ${filePath}`);
    return null;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = mimeTypes[ext];
  if (!mime) {
    console.warn(`Unsupported image type: ${filePath}`);
    return null;
  }

  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
};

const migrateCollection = async (Model, label) => {
  const docs = await Model.find({ image: { $regex: '/uploads/' } });
  let updated = 0;

  for (const doc of docs) {
    const dataUrl = imageToDataUrl(doc.image);
    if (!dataUrl) continue;

    doc.image = dataUrl;
    await doc.save();
    updated += 1;
  }

  console.log(`${label}: updated ${updated}/${docs.length}`);
};

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in backend/.env');

  await mongoose.connect(process.env.MONGO_URI);
  await migrateCollection(Canteen, 'Canteens');
  await migrateCollection(Meal, 'Meals');
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
