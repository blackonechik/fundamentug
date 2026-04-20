const { messages } = require('../data/messages');
const {
  documentTemplates,
  companyProfile,
  houseCatalog
} = require('../data/services');
const { documentsKeyboard } = require('../utils/keyboards');
const { buildPdfBuffer } = require('../utils/pdf');
const { buildDocumentCard } = require('../utils/documents');
const { buildEstimate } = require('../utils/estimate');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateStatusMessage(ctx, messageId, text) {
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    messageId,
    undefined,
    text,
    { parse_mode: 'HTML' }
  );
}

function getEstimateContext(ctx) {
  const currentEstimate =
    ctx.session.lastEstimate ||
    buildEstimate({
      areaM2: 100,
      floors: 1,
      packageId: 'standard_shell',
      selectedAddOnIds: [],
      selectedAddOnValues: {},
      wallMaterial: 'gas_block',
      location: 'anapa',
      foundationId: 'strip'
    });
  return currentEstimate ? { estimate: currentEstimate } : {};
}

async function sendDocument(ctx, documentType) {
  const context = getEstimateContext(ctx);
  const card = buildDocumentCard(documentType, context);
  const title = Object.values(documentTemplates).find((item) => item.id === documentType)?.title || 'Документ';
  const statusFrames = [
    '🧮 <b>Производятся расчеты...</b>\n▰▱▱',
    '📄 <b>Документ формируется...</b>\n▰▰▱',
    '✨ <b>Почти готово</b>\n▰▰▰'
  ];
  const statusMessage = await ctx.reply(statusFrames[0], { parse_mode: 'HTML' });

  await sleep(700);
  await updateStatusMessage(ctx, statusMessage.message_id, statusFrames[1]);
  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

  await sleep(700);
  await updateStatusMessage(ctx, statusMessage.message_id, statusFrames[2]);
  await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

  const pdfBuffer = await buildPdfBuffer({ documentType, context });

  await ctx.reply(
    [
      `${card.emoji} <b>${card.title}</b>`,
      card.subtitle,
      '',
      ...card.bullets.map((item) => `• ${item}`),
      '',
      `<i>${messages.contactDetails}</i>`,
      '',
      messages.documentPreview
    ].join('\n'),
    {
      parse_mode: 'HTML',
      reply_markup: documentsKeyboard()
    }
  );
  await ctx.replyWithDocument(
    {
      source: pdfBuffer,
      filename: `${documentType}.pdf`
    },
    { caption: `${messages.documentSent} ${title}` }
  );
}

function registerDocumentsHandlers(bot) {
  bot.command('docs', async (ctx) => {
    await ctx.reply(messages.documentsIntro, { reply_markup: documentsKeyboard() });
  });

  bot.action('flow_documents', async (ctx) => {
    await ctx.answerCbQuery();
    const lines = [messages.documentsIntro, ''];
    lines.push(`Компания: ${companyProfile.name}`);
    lines.push(`Каталог: ${houseCatalog.length} проектов`);
    lines.push(messages.contactDetails);
    await ctx.reply(lines.join('\n'), { reply_markup: documentsKeyboard() });
  });

  bot.action('doc_demo_estimate', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.demoEstimate.id);
  });

  bot.action('doc_commercial_offer', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.commercialOffer.id);
  });

  bot.action('doc_trim_levels', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.trimLevels.id);
  });

  bot.action('doc_house_catalog', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.houseCatalog.id);
  });

  bot.action('doc_checklist', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.checklist.id);
  });

  bot.action('doc_addons_price_list', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.addonsPriceList.id);
  });

  bot.action('doc_floor_plan', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.floorPlan.id);
  });

  bot.action('doc_contract', async (ctx) => {
    await ctx.answerCbQuery();
    await sendDocument(ctx, documentTemplates.contract.id);
  });
}

module.exports = { registerDocumentsHandlers };
