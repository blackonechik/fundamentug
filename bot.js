const fs = require('fs');
const path = require('path');
const { Telegraf, session } = require('telegraf');

const { regionConfig } = require('./data/services');
const { registerStartHandlers } = require('./scenes/start.scene');
const { registerCalculatorHandlers } = require('./scenes/calculator.scene');
const { registerCompareHandlers } = require('./scenes/compare.scene');
const { registerAddonsHandlers } = require('./scenes/addons.scene');
const { registerDocumentsHandlers } = require('./scenes/documents.scene');
const { registerCallbackHandlers } = require('./scenes/callback.scene');
const { registerVisitHandlers } = require('./scenes/visit.scene');
const { registerGalleryHandlers } = require('./scenes/gallery.scene');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, equalsIndex).trim();
    const rawValue = trimmedLine.slice(equalsIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = normalizedValue;
    }
  });
}

loadEnvFile(path.resolve(process.cwd(), '.env'));

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Telegraf(token);

bot.use(session({
  defaultSession: () => ({
    calculator: null,
    pendingFlow: null,
    lastEstimate: null,
    callbackRequest: null,
    visitRequest: null
  })
}));

bot.use(async (ctx, next) => {
  ctx.state.regionConfig = regionConfig;
  return next();
});

registerStartHandlers(bot);
registerCalculatorHandlers(bot);
registerCompareHandlers(bot);
registerAddonsHandlers(bot);
registerDocumentsHandlers(bot);
registerCallbackHandlers(bot);
registerVisitHandlers(bot);
registerGalleryHandlers(bot);

bot.catch((err) => {
  console.error('Bot error', err);
});

bot.launch().then(() => {
  console.log(`Bot started for ${regionConfig.regionName}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
