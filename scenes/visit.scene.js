const { messages } = require('../data/messages');
const { regionConfig, companyProfile } = require('../data/services');
const {
  visitSlotsKeyboard,
  phoneRequestKeyboard,
  addressRequestKeyboard,
  removeKeyboard
} = require('../utils/keyboards');
const { showStartMenu } = require('./start.scene');

const slotLabels = {
  visit_slot_tue_11: 'Вт 11:00',
  visit_slot_thu_15: 'Чт 15:00',
  visit_slot_sat_12: 'Сб 12:00',
  visit_slot_sun_10: 'Вс 10:00'
};

function registerVisitHandlers(bot) {
  bot.action('schedule_visit', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.session.pendingFlow = 'visit';
    ctx.session.visitRequest = {
      stage: 'choose_slot'
    };
    await ctx.reply('Выберите удобный слот для выезда инженера:', {
      reply_markup: visitSlotsKeyboard()
    });
  });

  Object.keys(slotLabels).forEach((slotId) => {
    bot.action(slotId, async (ctx) => {
      await ctx.answerCbQuery();
      ctx.session.visitRequest = {
        requestedAt: new Date().toISOString(),
        slotId,
        slotLabel: slotLabels[slotId],
        stage: 'awaiting_phone',
        status: 'pending'
      };
      await ctx.reply(
        `Слот выбран: ${slotLabels[slotId]}\nТеперь отправьте номер телефона через кнопку ниже или напишите его текстом.`,
        { reply_markup: phoneRequestKeyboard() }
      );
    });
  });

  bot.on('contact', async (ctx, next) => {
    if (!ctx.session.visitRequest || ctx.session.visitRequest.stage !== 'awaiting_phone') {
      return next();
    }

    ctx.session.visitRequest.phone = ctx.message.contact.phone_number;
    ctx.session.visitRequest.stage = 'awaiting_address';

    await ctx.reply(
      'Номер получил. Теперь отправьте свой адрес через кнопку ниже или напишите его текстом.',
      { reply_markup: addressRequestKeyboard() }
    );
    return undefined;
  });

  bot.on('location', async (ctx, next) => {
    if (!ctx.session.visitRequest || ctx.session.visitRequest.stage !== 'awaiting_address') {
      return next();
    }

    const { latitude, longitude } = ctx.message.location;
    ctx.session.visitRequest.address = `Геолокация: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    ctx.session.visitRequest.stage = 'confirmed';

    await ctx.reply(
      `${messages.visitDone}\nСлот: ${ctx.session.visitRequest.slotLabel}\nТелефон: ${ctx.session.visitRequest.phone}\nАдрес: ${ctx.session.visitRequest.address}\n${companyProfile.contactsLine}`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть карту', url: regionConfig.mapLink }]]
        }
      }
    );
    await ctx.reply('Спасибо! Мы свяжемся с вами для подтверждения визита. А пока вы можете ознакомиться с нашим каталогом домов.', {
      reply_markup: removeKeyboard()
    });
    return undefined;
  });

  bot.on('text', async (ctx, next) => {
    if (!ctx.session.visitRequest) {
      return next();
    }

    const text = ctx.message.text.trim();

    if (text === 'В меню') {
      ctx.session.visitRequest = null;
      await ctx.reply('Возвращаю в меню.', { reply_markup: removeKeyboard() });
      await showStartMenu(ctx);
      return undefined;
    }

    if (ctx.session.visitRequest.stage === 'awaiting_phone') {
      ctx.session.visitRequest.phone = text;
      ctx.session.visitRequest.stage = 'awaiting_address';
      await ctx.reply(
        'Номер получил. Теперь отправьте свой адрес через кнопку ниже или напишите его текстом.',
        { reply_markup: addressRequestKeyboard() }
      );
      return undefined;
    }

    if (ctx.session.visitRequest.stage === 'awaiting_address') {
      ctx.session.visitRequest.address = text;
      ctx.session.visitRequest.stage = 'confirmed';
      await ctx.reply(
        `${messages.visitDone}\nСлот: ${ctx.session.visitRequest.slotLabel}\nТелефон: ${ctx.session.visitRequest.phone}\nАдрес: ${ctx.session.visitRequest.address}\n${companyProfile.contactsLine}`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: 'Открыть карту', url: regionConfig.mapLink }]]
          }
        }
      );
      await ctx.reply('Спасибо! Мы свяжемся с вами для подтверждения визита. А пока вы можете ознакомиться с нашим каталогом домов.', {
        reply_markup: removeKeyboard()
      });
      return undefined;
    }

    return next();
  });
}

module.exports = { registerVisitHandlers };
