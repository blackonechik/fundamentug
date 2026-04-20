const { messages } = require('../data/messages');
const { startKeyboard } = require('../utils/keyboards');

function resetFlow(ctx) {
  ctx.session.calculator = null;
  ctx.session.pendingFlow = null;
}

async function showStartMenu(ctx) {
  resetFlow(ctx);
  await ctx.reply(messages.start, { reply_markup: startKeyboard() });
}

function registerStartHandlers(bot) {
  bot.start(showStartMenu);
  bot.command('menu', showStartMenu);
  bot.action('back_start', showStartMenu);

  bot.action('flow_calc', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.pendingFlow = 'calc';
    ctx.session.calculator = {
      step: 'location',
      location: 'anapa',
      areaM2: null,
      floors: 1,
      packageId: 'standard_shell',
      foundationId: 'strip',
      wallMaterial: 'gas_block',
      selectedAddOnIds: [],
      selectedAddOnValues: {}
    };
    await ctx.reply('Сначала уточним локацию.', {
      reply_markup: require('../utils/keyboards').locationKeyboard()
    });
  });
}

module.exports = {
  registerStartHandlers,
  showStartMenu
};
