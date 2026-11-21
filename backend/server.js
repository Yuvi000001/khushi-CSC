require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const Service = require('./models/Service');
const Scheme = require('./models/Scheme');
const SystemState = require('./models/SystemState');

async function seedServices() {
  if (await Service.countDocuments()) return;
  await Service.insertMany(require('./utils/defaultServices'));
  console.log('[seed] default services added');
}

async function seedSchemes() {
  const key = 'default-schemes-v1';
  if (await SystemState.exists({ key })) return;
  if (!(await Scheme.countDocuments())) {
    await Scheme.insertMany(require('./utils/defaultSchemes'));
    console.log('[seed] default schemes added');
  }
  await SystemState.create({ key });
}

(async () => {
  for (const k of ['JWT_SECRET', 'MONGODB_URI', 'CLIENT_URL']) {
    if (!process.env[k]) { console.error(`.env me ${k} set karein`); process.exit(1); }
  }
  if (process.env.JWT_SECRET.length < 32) console.warn('[warn] JWT_SECRET kam se kam 32 akshar ka rakhein');
  await connectDB();
  await seedServices();
  await seedSchemes();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`[server] http://localhost:${port}`));
})().catch((e) => { console.error('[startup]', e.message); process.exit(1); });
