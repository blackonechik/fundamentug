const { messages } = require('../data/messages');
const { areaOptions, floorOptions, packages, foundations, addons } = require('../data/services');
const { buildEstimate, buildEstimateNarrative, getPackageComparison } = require('../utils/estimate');
const { formatMoney, formatTimelineRange } = require('../utils/formatters');
const {
  areaKeyboard,
  floorKeyboard,
  packageKeyboard,
  foundationKeyboard,
  addonKeyboard,
  estimateActionsKeyboard
} = require('../utils/keyboards');
const { buildPdfBuffer } = require('../utils/pdf');

function ensureCalculator(ctx) {
  if (!ctx.session.calculator) {
    ctx.session.calculator = {
      step: 'location',
      location: 'anapa',
      areaM2: 100,
      floors: 1,
      packageId: 'standard_shell',
      foundationId: 'strip',
      wallMaterial: 'gas_block',
      selectedAddOnIds: [],
      selectedAddOnValues: {}
    };
  }
  return ctx.session.calculator;
}

function buildCurrentEstimate(ctx) {
  const calculator = ensureCalculator(ctx);
  if (!calculator.areaM2 || !calculator.packageId) return null;

  return buildEstimate({
    areaM2: calculator.areaM2,
    floors: calculator.floors,
    packageId: calculator.packageId,
    selectedAddOnIds: calculator.selectedAddOnIds,
    selectedAddOnValues: calculator.selectedAddOnValues,
    wallMaterial: calculator.wallMaterial,
    location: calculator.location,
    foundationId: calculator.foundationId
  });
}

async function showEstimate(ctx, estimate) {
  ctx.session.lastEstimate = estimate;
  const text = [
    messages.estimateReady,
    '',
    `Площадь: ${estimate.areaM2} м²`,
    `Этажность: ${estimate.floors}`,
    `Пакет: ${estimate.package.title}`,
    `Фундамент: ${estimate.foundation.title}`,
    `Срок: ${formatTimelineRange(estimate.timelineDays)}`,
    '',
    buildEstimateNarrative(estimate),
    '',
    `Итого: ${formatMoney(estimate.totalPrice)}`,
    estimate.disclaimer
  ].join('\n');

  await ctx.reply(text, { reply_markup: estimateActionsKeyboard() });
}

async function advanceToNextStep(ctx) {
  const calculator = ensureCalculator(ctx);

  if (calculator.step === 'location') {
    calculator.step = 'area';
    await ctx.reply(messages.chooseArea, { reply_markup: areaKeyboard() });
    return;
  }

  if (calculator.step === 'area') {
    calculator.step = 'floors';
    await ctx.reply(messages.chooseFloors, { reply_markup: floorKeyboard() });
    return;
  }

  if (calculator.step === 'floors') {
    calculator.step = 'package';
    await ctx.reply(messages.choosePackage, { reply_markup: packageKeyboard() });
    return;
  }

  if (calculator.step === 'package') {
    calculator.step = 'foundation';
    await ctx.reply(messages.chooseFoundation, { reply_markup: foundationKeyboard() });
    return;
  }

  if (calculator.step === 'foundation') {
    calculator.step = 'addons';
    await ctx.reply(messages.chooseAddons, {
      reply_markup: addonKeyboard(calculator.selectedAddOnIds)
    });
    return;
  }

  if (calculator.step === 'addons') {
    const estimate = buildCurrentEstimate(ctx);
    if (estimate) {
      calculator.step = 'result';
      await showEstimate(ctx, estimate);
    }
  }
}

async function tryHandleText(ctx) {
  const calculator = ensureCalculator(ctx);
  const text = (ctx.message.text || '').trim();

  if (calculator.step === 'location') {
    calculator.location = text.toLowerCase().includes('рай') ? 'district' : 'anapa';
    await advanceToNextStep(ctx);
    return true;
  }

  if (calculator.step === 'area') {
    const parsedArea = Number(text.replace(/[^\d]/g, ''));
    if (areaOptions.includes(parsedArea)) {
      calculator.areaM2 = parsedArea;
      await advanceToNextStep(ctx);
      return true;
    }
  }

  if (calculator.step === 'floors') {
    const parsedFloors = Number(text.replace(/[^\d]/g, ''));
    if (floorOptions.includes(parsedFloors)) {
      calculator.floors = parsedFloors;
      await advanceToNextStep(ctx);
      return true;
    }
  }

  return false;
}

async function handleFlowCompare(ctx) {
  const calculator = ensureCalculator(ctx);
  const areaM2 = calculator.areaM2 || 100;
  const floors = calculator.floors || 1;
  const comparison = getPackageComparison(areaM2, floors);
  const lines = ['📊 Сравнение пакетов:', ''];

  comparison.forEach((item) => {
    lines.push(`${item.title} (${item.subtitle})`);
    lines.push(`Срок: ${formatTimelineRange(item.timelineDays)}`);
    lines.push(`Оценка: ${formatMoney(item.total)}`);
    lines.push(`Входит: ${item.includes.join(', ')}`);
    lines.push('');
  });

  await ctx.reply(lines.join('\n'));
}

function buildAddonCatalogText(selectedAddOnIds, locale, currency) {
  const lines = [`🧩 Каталог допуслуг для демо-расчета: ${selectedAddOnIds.length} выбрано`, ''];

  addons.forEach((addon) => {
    const isSelected = selectedAddOnIds.includes(addon.id);
    lines.push(`${isSelected ? '✅' : '⬜'} ${addon.title} — ${addon.description} (${formatAddonPrice(addon, locale, currency)})`);
  });

  return lines.join('\n');
}

async function handleAddonStandalone(ctx) {
  const locale = ctx.state.regionConfig.locale;
  const currency = ctx.state.regionConfig.currency;
  const selectedAddOnIds = ensureCalculator(ctx).selectedAddOnIds;
  await ctx.reply(buildAddonCatalogText(selectedAddOnIds, locale, currency), {
    reply_markup: addonKeyboard(selectedAddOnIds)
  });
}

function formatAddonPrice(addon, locale, currency) {
  if (addon.pricingMode === 'per_m2') {
    return `${formatMoney(addon.defaultValue, locale, currency)} / м²`;
  }
  if (addon.pricingMode === 'per_unit') {
    return `${formatMoney(addon.defaultValue, locale, currency)} / выезд`;
  }
  return `${formatMoney(addon.min, locale, currency)} - ${formatMoney(addon.max, locale, currency)}`;
}

function registerCalculatorHandlers(bot) {
  bot.on('text', async (ctx, next) => {
    if (!ctx.session.calculator || ctx.session.calculator.step === 'result') {
      return next();
    }

    const handled = await tryHandleText(ctx);
    if (!handled) {
      await ctx.reply(messages.fallback);
    }
    return undefined;
  });

  bot.action('location_anapa', async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.location = 'anapa';
    await advanceToNextStep(ctx);
  });

  bot.action('location_district', async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.location = 'district';
    await advanceToNextStep(ctx);
  });

  bot.action('location_unknown', async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.location = 'anapa';
    await advanceToNextStep(ctx);
  });

  bot.action(/^area_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.areaM2 = Number(ctx.match[1]);
    await advanceToNextStep(ctx);
  });

  bot.action(/^floors_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.floors = Number(ctx.match[1]);
    await advanceToNextStep(ctx);
  });

  bot.action(/^package_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.packageId = ctx.match[1];
    await advanceToNextStep(ctx);
  });

  bot.action(/^foundation_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.foundationId = ctx.match[1];
    await advanceToNextStep(ctx);
  });

  bot.action(/^addon_toggle_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    const addOnId = ctx.match[1];
    const selected = new Set(calculator.selectedAddOnIds);
    const wasSelected = selected.has(addOnId);
    if (selected.has(addOnId)) {
      selected.delete(addOnId);
    } else {
      selected.add(addOnId);
    }
    calculator.selectedAddOnIds = Array.from(selected);
    const locale = ctx.state.regionConfig.locale;
    const currency = ctx.state.regionConfig.currency;
    const text = buildAddonCatalogText(calculator.selectedAddOnIds, locale, currency);

    await ctx.answerCbQuery(wasSelected ? 'Убрано' : 'Добавлено');
    await ctx.editMessageText(text, {
      reply_markup: addonKeyboard(calculator.selectedAddOnIds)
    });
  });

  bot.action('addons_reset', async (ctx) => {
    await ctx.answerCbQuery('Сброшено');
    const calculator = ensureCalculator(ctx);
    calculator.selectedAddOnIds = [];
    const locale = ctx.state.regionConfig.locale;
    const currency = ctx.state.regionConfig.currency;

    await ctx.editMessageText(buildAddonCatalogText([], locale, currency), {
      reply_markup: addonKeyboard([])
    });
  });

  bot.action('addons_done', async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.step = 'result';
    const estimate = buildCurrentEstimate(ctx);
    if (estimate) {
      await showEstimate(ctx, estimate);
    }
  });

  bot.action('estimate_addons', async (ctx) => {
    await ctx.answerCbQuery();
    const calculator = ensureCalculator(ctx);
    calculator.step = 'addons';
    await ctx.reply(messages.chooseAddons, {
      reply_markup: addonKeyboard(calculator.selectedAddOnIds)
    });
  });

  bot.action('compare_premium', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Сравниваю с Premium по тем же параметрам...');
    await handleFlowCompare(ctx);
  });

  bot.action('compare_show', async (ctx) => {
    await ctx.answerCbQuery();
    await handleFlowCompare(ctx);
  });

  bot.action('send_pdf', async (ctx) => {
    await ctx.answerCbQuery();
    const estimate = ctx.session.lastEstimate || buildCurrentEstimate(ctx);
    if (!estimate) {
      await ctx.reply('Сначала нужен расчет. Запускаю калькулятор из меню.');
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
      return;
    }
    const pdfBuffer = await buildPdfBuffer(estimate);
    await ctx.replyWithDocument({
      source: pdfBuffer,
      filename: `smeta-${estimate.areaM2}m2.pdf`
    }, { caption: messages.pdfReady });
  });
}

module.exports = {
  registerCalculatorHandlers,
  buildCurrentEstimate,
  showEstimate
};
