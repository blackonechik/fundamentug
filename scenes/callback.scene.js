const { messages } = require('../data/messages');
const { companyProfile } = require('../data/services');
const { callbackKeyboard } = require('../utils/keyboards');

function registerCallbackHandlers(bot) {
  bot.action('request_callback', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.callbackRequest = {
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    await ctx.reply(
      `Оставьте номер телефона текстом в ответе, и я сохраню демозаявку.\n${companyProfile.contactsLine}`,
      { reply_markup: callbackKeyboard() }
    );
  });

  bot.action('callback_confirm', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.callbackRequest = {
      requestedAt: new Date().toISOString(),
      status: 'confirmed'
    };
    await ctx.reply(`${messages.callbackDone}\n${companyProfile.contactsLine}`);
  });

  bot.on('text', async (ctx, next) => {
    if (!ctx.session.callbackRequest || ctx.session.callbackRequest.status !== 'pending') {
      return next();
    }

    ctx.session.callbackRequest = {
      ...ctx.session.callbackRequest,
      phoneOrContact: ctx.message.text.trim(),
      status: 'captured'
    };
    await ctx.reply(`Контакт принят: ${ctx.message.text.trim()}\n${messages.callbackDone}\n${companyProfile.contactsLine}`);
    return undefined;
  });
}

module.exports = { registerCallbackHandlers };
