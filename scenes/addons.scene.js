const { messages } = require('../data/messages');
const { addons } = require('../data/services');
const { formatRange, formatMoney } = require('../utils/formatters');
const { addonKeyboard } = require('../utils/keyboards');

function addonPriceLabel(addon, locale, currency) {
  if (addon.pricingMode === 'per_m2') {
    return `${formatMoney(addon.defaultValue, locale, currency)} / м²`;
  }
  if (addon.pricingMode === 'per_unit') {
    return `${formatRange(addon.min, addon.max, locale, currency)} / выезд`;
  }
  return formatRange(addon.min, addon.max, locale, currency);
}

function registerAddonsHandlers(bot) {
  bot.action('flow_addons', async (ctx) => {
    await ctx.answerCbQuery();
    const locale = ctx.state.regionConfig.locale;
    const currency = ctx.state.regionConfig.currency;
    const lines = [messages.addonsIntro, ''];

    addons.forEach((addon) => {
      const isSelected = ctx.session.calculator?.selectedAddOnIds?.includes(addon.id);
      lines.push(`${isSelected ? '✅' : '⬜'} ${addon.title} — ${addon.description} (${addonPriceLabel(addon, locale, currency)})`);
    });

    await ctx.reply(lines.join('\n'), {
      reply_markup: addonKeyboard(ctx.session.calculator?.selectedAddOnIds || [])
    });
  });
}

module.exports = { registerAddonsHandlers };
