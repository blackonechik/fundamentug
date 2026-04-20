const { messages } = require('../data/messages');
const { getPackageComparison } = require('../utils/estimate');
const { formatMoney, formatTimelineRange } = require('../utils/formatters');

function registerCompareHandlers(bot) {
  bot.action('flow_compare', async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ctx.session.calculator || {};
    const areaM2 = calculator.areaM2 || 100;
    const floors = calculator.floors || 1;
    const comparison = getPackageComparison(areaM2, floors);

    const lines = [messages.compareIntro, ''];
    comparison.forEach((item) => {
      lines.push(`${item.title} / ${item.subtitle}`);
      lines.push(`Оценка: ${formatMoney(item.total)}`);
      lines.push(`Срок: ${formatTimelineRange(item.timelineDays)}`);
      lines.push(`Состав: ${item.includes.join(', ')}`);
      lines.push('');
    });

    await ctx.reply(lines.join('\n'));
  });
}

module.exports = { registerCompareHandlers };
