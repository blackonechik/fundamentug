const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const {
  companyProfile,
  documentTemplates,
  houseCatalog,
  contractorChecklist,
  addonPriceList,
  floorPlanExample,
  contractDemo
} = require('../data/services');
const { formatMoney, formatTimelineRange } = require('./formatters');
const { buildEstimate } = require('./estimate');

const bodyFontCandidates = [
  '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf'
];
const displayFontCandidates = [
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  '/System/Library/Fonts/Supplemental/Georgia.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
];

const bodyFontPath = bodyFontCandidates.find((candidate) => fs.existsSync(candidate));
const displayFontPath = displayFontCandidates.find((candidate) => fs.existsSync(candidate));

function setBodyFont(doc) {
  if (bodyFontPath) {
    doc.font(bodyFontPath);
  }
}

function setDisplayFont(doc) {
  if (displayFontPath) {
    doc.font(displayFontPath);
  } else {
    setBodyFont(doc);
  }
}

function resolveAsset(assetPath) {
  return path.resolve(process.cwd(), assetPath);
}

function assetExists(assetPath) {
  return fs.existsSync(resolveAsset(assetPath));
}

function createPdfBuffer(renderFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    setBodyFont(doc);

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    renderFn(doc);
    doc.end();
  });
}

function addHeader(doc, title, subtitle) {
  const logoPath = companyProfile.logoPath;

  if (assetExists(logoPath)) {
    doc.image(resolveAsset(logoPath), 40, 34, { width: 48 });
  }

  setDisplayFont(doc);
  doc.fillColor('#111827').fontSize(20).text(companyProfile.name, 100, 36);
  setBodyFont(doc);
  doc.fillColor('#6B7280').fontSize(10).text(subtitle || companyProfile.shortAbout, 100, 63, { width: 420 });
  doc.moveDown(2);
  setDisplayFont(doc);
  doc.fontSize(18).fillColor('#111827').text(title, { align: 'center' });
  setBodyFont(doc);
  doc.moveDown(0.5);
  doc.fillColor('#DC2626').fontSize(9).text('Демо-расчет, не является публичной офертой', { align: 'center' });
  doc.moveDown(1);
}

function addFooter(doc) {
  const footerY = 760;
  const logoPath = companyProfile.logoPath;

  doc.save();
  doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).stroke('#D1D5DB');
  doc.restore();

  if (assetExists(logoPath)) {
    doc.image(resolveAsset(logoPath), 40, footerY, { width: 20, height: 20 });
  }

  setBodyFont(doc);
  doc.fillColor('#6B7280').fontSize(8).text(companyProfile.legalName, 66, footerY - 1, { width: 250 });
  doc.text(`ИНН: ${companyProfile.inn}`, 320, footerY - 1, { width: 100, align: 'right' });
  doc.text(companyProfile.address, 425, footerY - 1, { width: 130, align: 'right' });
}

function addSectionTitle(doc, title) {
  doc.moveDown(0.6);
  setDisplayFont(doc);
  doc.fillColor('#111827').fontSize(14).text(title);
  setBodyFont(doc);
  doc.moveDown(0.25);
}

function addBulletList(doc, items, options = {}) {
  const bulletIndent = options.indent || 14;
  const width = options.width || 500;
  items.forEach((item) => {
    doc.fontSize(options.fontSize || 10).fillColor('#111827').text(`• ${item}`, {
      indent: bulletIndent,
      width
    });
  });
}

function addKeyValueRow(doc, label, value) {
  const y = doc.y;
  doc.fillColor('#374151').fontSize(10).text(label, 40, y, { width: 180 });
  doc.fillColor('#111827').fontSize(10).text(value, 220, y, { width: 330 });
  doc.moveDown(1);
}

function addTable(doc, columns, rows, options = {}) {
  const startX = options.startX || 40;
  const startY = doc.y;
  const columnWidths = options.columnWidths || [];
  const rowHeight = options.rowHeight || 24;
  const headerHeight = options.headerHeight || 28;
  let y = startY;

  doc.save();
  doc.rect(startX, y, columnWidths.reduce((sum, width) => sum + width, 0), headerHeight).fill('#F3F4F6');
  doc.restore();

  let x = startX;
  columns.forEach((column, index) => {
    doc.fillColor('#111827').fontSize(9).text(column, x + 6, y + 9, {
      width: columnWidths[index] - 12,
      align: 'center'
    });
    x += columnWidths[index];
  });

  y += headerHeight;

  rows.forEach((row, rowIndex) => {
    x = startX;
    const currentHeight = rowHeight;
    row.forEach((cell, index) => {
      doc.rect(x, y, columnWidths[index], currentHeight).stroke('#D1D5DB');
      doc.fillColor('#111827').fontSize(9).text(cell, x + 6, y + 7, {
        width: columnWidths[index] - 12,
        align: index === 0 ? 'left' : 'center'
      });
      x += columnWidths[index];
    });
    y += currentHeight;
  });

  doc.y = y + 10;
}

function addHighlightBox(doc, title, value, note) {
  const x = 40;
  const y = doc.y;
  const width = 515;
  const height = note ? 68 : 52;

  doc.save();
  doc.roundedRect(x, y, width, height, 10).fillAndStroke('#F8FAFC', '#CBD5E1');
  doc.restore();

  setDisplayFont(doc);
  doc.fillColor('#0F172A').fontSize(10).text(title, x + 14, y + 10, { width: width - 28 });
  setBodyFont(doc);
  doc.fillColor('#111827').fontSize(20).text(value, x + 14, y + 24, { width: width - 28 });
  if (note) {
    doc.fillColor('#6B7280').fontSize(8).text(note, x + 14, y + 48, { width: width - 28 });
  }

  doc.y = y + height + 12;
}

function renderDemoEstimate(estimate) {
  return createPdfBuffer((doc) => {
    addHeader(doc, 'Деморасчёт', 'Ориентировочная смета по выбранным параметрам');
    addHighlightBox(
      doc,
      'Итоговая стоимость',
      formatMoney(estimate.totalPrice),
      `${estimate.package.title} / ${estimate.package.subtitle} · срок ${formatTimelineRange(estimate.timelineDays)}`
    );

    addSectionTitle(doc, 'Ключевые параметры');
    addTable(
      doc,
      ['Параметр', 'Значение', 'Комментарий'],
      [
        ['Регион', 'Анапа и Анапский район', 'Локальный расчет'],
        ['Дата', estimate.asOfDate, 'Срез цен'],
        ['Площадь', `${estimate.areaM2} м²`, 'Базовый сценарий'],
        ['Фундамент', estimate.foundation.title, estimate.foundation.description],
        ['Пакет', `${estimate.package.title} / ${estimate.package.subtitle}`, 'Основная комплектация'],
        ['Срок', formatTimelineRange(estimate.timelineDays), 'Ориентировочно']
      ],
      {
        columnWidths: [140, 150, 225],
        rowHeight: 28
      }
    );

    addSectionTitle(doc, 'Состав сметы');
    addTable(
      doc,
      ['Позиция', 'Сумма', 'Основание'],
      estimate.lineItems.map((lineItem) => [
        lineItem.title,
        formatMoney(lineItem.amount),
        lineItem.description || '—'
      ]),
      {
        columnWidths: [220, 100, 195],
        rowHeight: 28
      }
    );

    doc.fontSize(9).fillColor('#6B7280').text(estimate.disclaimer);
    addFooter(doc);
  });
}

function renderCommercialOffer(estimate) {
  return createPdfBuffer((doc) => {
    addHeader(doc, 'Коммерческое предложение', 'Главный продающий документ для первичного согласования');
    addSectionTitle(doc, 'О компании');
    doc.fontSize(10).fillColor('#111827').text(companyProfile.shortPitch);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#374151').text(companyProfile.shortAbout);

    addSectionTitle(doc, 'Что входит в строительство');
    addBulletList(doc, companyProfile.buildingStages);

    addSectionTitle(doc, 'Условия');
    addKeyValueRow(doc, 'Сроки', companyProfile.timelines);
    addKeyValueRow(doc, 'Цена', `${companyProfile.priceFrom} по базовой комплектации`);

    addSectionTitle(doc, 'Преимущества');
    companyProfile.guarantees.forEach((item) => {
      doc.fontSize(11).fillColor('#111827').text(`✔ ${item}`);
    });

    addSectionTitle(doc, 'Пример ориентировочной комплектации');
    addBulletList(doc, [
      `Фундамент: ${estimate.foundation.title}`,
      'Стены',
      'Крыша',
      'Окна',
      `Цена: ${formatMoney(estimate.totalPrice)}`
    ]);
    addFooter(doc);
  });
}

function renderTrimLevels() {
  const rows = [
    ['Фундамент', '✔', '✔', '✔'],
    ['Отделка', '❌', '✔', '✔'],
    ['Электрика', '❌', '✔', '✔'],
    ['Сантехника', '❌', '✔', '✔'],
    ['Окна', '✔', '✔', '✔'],
    ['Сроки', 'Короткие', 'Средние', 'Полный цикл']
  ];

  return createPdfBuffer((doc) => {
    addHeader(doc, 'Комплектации домов', 'Сравнение трех тарифов для выбора без звонка');
    addTable(doc, ['Что входит', 'База', 'Комфорт', 'Премиум'], rows, {
      columnWidths: [180, 80, 80, 100],
      rowHeight: 26
    });
    addSectionTitle(doc, 'Коротко');
    addBulletList(doc, [
      'Базовая подходит для старта без лишних надстроек',
      'Комфорт балансирует цену и готовность к заезду',
      'Премиум закрывает стройку почти под ключ'
    ]);
    addFooter(doc);
  });
}

function renderHouseCatalog() {
  return createPdfBuffer((doc) => {
    const title = 'Каталог домов';
    const subtitle = 'Подборка готовых проектов с площадью и ценой от';
    addHeader(doc, title, subtitle);
    houseCatalog.forEach((project, index) => {
      if (index > 0) {
        addFooter(doc);
        doc.addPage();
        addHeader(doc, title, subtitle);
      }

      doc.fontSize(16).fillColor('#111827').text(project.title);
      doc.fontSize(10).fillColor('#6B7280').text(`${project.areaM2} м² · ${formatMoney(project.priceFrom)} и выше`);
      doc.moveDown(0.5);

      if (assetExists(project.imagePath)) {
        doc.image(resolveAsset(project.imagePath), { fit: [515, 220], align: 'center' });
      }

      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#111827').text(project.description);
      doc.moveDown(0.25);
      addBulletList(doc, project.highlights);
    });
    addFooter(doc);
  });
}

function renderChecklist() {
  return createPdfBuffer((doc) => {
    addHeader(doc, 'Чек-лист подрядчика', '10 ошибок, которых можно избежать до подписания договора');
    contractorChecklist.forEach((item, index) => {
      doc.fontSize(11).fillColor('#111827').text(`${index + 1}. ${item}`);
      doc.moveDown(0.15);
    });
    addSectionTitle(doc, 'Финальный акцент');
    doc.fontSize(11).fillColor('#111827').text(`${companyProfile.name} — работаем по договору и с гарантией.`);
    addFooter(doc);
  });
}

function renderAddonPriceList() {
  return createPdfBuffer((doc) => {
    addHeader(doc, 'Прайс на доп. услуги', 'Блок монетизации для апсейла после основной заявки');
    addTable(doc, ['Услуга', 'Цена', 'Комментарий'], addonPriceList.map((item) => [item.title, item.value, item.note]), {
      columnWidths: [210, 120, 180],
      rowHeight: 28
    });

    addSectionTitle(doc, 'Дополнительно');
    doc.fontSize(10).fillColor('#111827').text('Все цены ориентировочные и могут меняться в зависимости от грунта, площади и состава работ.');
    addFooter(doc);
  });
}

function drawPlanRoom(doc, x, y, width, height, label) {
  doc.save();
  doc.roundedRect(x, y, width, height, 8).fillAndStroke('#F9FAFB', '#D1D5DB');
  doc.restore();
  doc.fillColor('#111827').fontSize(10).text(label, x + 8, y + height / 2 - 5, {
    width: width - 16,
    align: 'center'
  });
}

function renderFloorPlan() {
  return createPdfBuffer((doc) => {
    addHeader(doc, floorPlanExample.title, floorPlanExample.size);
    doc.fontSize(10).fillColor('#6B7280').text(`Комнаты: ${floorPlanExample.rooms.join(', ')}`);
    doc.moveDown(0.5);

    const originX = 70;
    const originY = 170;
    const houseWidth = 430;
    const houseHeight = 260;

    doc.save();
    doc.roundedRect(originX, originY, houseWidth, houseHeight, 12).stroke('#111827');
    doc.restore();

    drawPlanRoom(doc, originX + 20, originY + 20, 180, 90, 'Кухня-гостиная');
    drawPlanRoom(doc, originX + 220, originY + 20, 170, 90, 'Спальня');
    drawPlanRoom(doc, originX + 20, originY + 130, 170, 90, 'Спальня');
    drawPlanRoom(doc, originX + 210, originY + 130, 90, 90, 'Санузел');
    drawPlanRoom(doc, originX + 310, originY + 130, 80, 90, 'Котельная');
    drawPlanRoom(doc, originX + 130, originY + 230, 170, 70, 'Тамбур');

    doc.y = originY + houseHeight + 30;
    addSectionTitle(doc, 'Примечание');
    doc.fontSize(10).fillColor('#111827').text('Это демо-схема для вау-эффекта. Реальную планировку можно адаптировать под участок и пожелания семьи.');
    addFooter(doc);
  });
}

function renderContract() {
  return createPdfBuffer((doc) => {
    addHeader(doc, 'Упрощенный демо-договор', 'Базовая структура договора для доверия и предварительного согласования');
    addKeyValueRow(doc, 'Стороны', contractDemo.parties.join(' и '));
    addKeyValueRow(doc, 'Сроки', contractDemo.timelineText);
    addKeyValueRow(doc, 'Стоимость', contractDemo.amountText);
    addKeyValueRow(doc, 'Гарантия', `${contractDemo.guaranteeYears} лет`);

    addSectionTitle(doc, 'Ключевые разделы');
    addBulletList(doc, contractDemo.sections);

    addSectionTitle(doc, 'Формула доверия');
    doc.fontSize(10).fillColor('#111827').text('Договор фиксирует предмет работ, цену, сроки, гарантию и порядок приемки. Это демо-версия, не юридический документ.');
    addFooter(doc);
  });
}

function buildCommercialDocument(documentType, context = {}) {
  const selectedEstimate = context.estimate || buildEstimate({
    areaM2: 100,
    floors: 1,
    packageId: 'standard_shell',
    selectedAddOnIds: [],
    selectedAddOnValues: {},
    wallMaterial: 'gas_block',
    location: 'anapa',
    foundationId: 'strip'
  });

  switch (documentType) {
    case documentTemplates.demoEstimate.id:
      return renderDemoEstimate(selectedEstimate);
    case documentTemplates.commercialOffer.id:
      return renderCommercialOffer(selectedEstimate);
    case documentTemplates.trimLevels.id:
      return renderTrimLevels();
    case documentTemplates.houseCatalog.id:
      return renderHouseCatalog();
    case documentTemplates.checklist.id:
      return renderChecklist();
    case documentTemplates.addonsPriceList.id:
      return renderAddonPriceList();
    case documentTemplates.floorPlan.id:
      return renderFloorPlan();
    case documentTemplates.contract.id:
      return renderContract();
    default:
      return renderDemoEstimate(selectedEstimate);
  }
}

function buildDocumentCard(documentType, context = {}) {
  const selectedEstimate = context.estimate || buildEstimate({
    areaM2: 100,
    floors: 1,
    packageId: 'standard_shell',
    selectedAddOnIds: [],
    selectedAddOnValues: {},
    wallMaterial: 'gas_block',
    location: 'anapa',
    foundationId: 'strip'
  });

  const cards = {
    [documentTemplates.demoEstimate.id]: {
      emoji: '💰',
      title: 'Деморасчёт',
      subtitle: `Ориентир по дому ${selectedEstimate.areaM2} м²`,
      bullets: [
        `Итого: ${formatMoney(selectedEstimate.totalPrice)}`,
        `Срок: ${formatTimelineRange(selectedEstimate.timelineDays)}`,
        'Подходит для первичного понимания бюджета'
      ]
    },
    [documentTemplates.commercialOffer.id]: {
      emoji: '🤝',
      title: 'Коммерческое предложение',
      subtitle: 'Готовый продающий документ для согласования',
      bullets: [
        `Цена: ${companyProfile.priceFrom}`,
        `Сроки: ${companyProfile.timelines}`,
        'Работаем по договору и с гарантией'
      ]
    },
    [documentTemplates.trimLevels.id]: {
      emoji: '🧱',
      title: 'Комплектации домов',
      subtitle: 'База, Комфорт, Премиум',
      bullets: [
        'Сравнение по фундаменту, отделке и электрике',
        'Удобно для выбора пакета без звонка'
      ]
    },
    [documentTemplates.houseCatalog.id]: {
      emoji: '🏡',
      title: 'Каталог домов',
      subtitle: `${houseCatalog.length} готовых проектов`,
      bullets: [
        `Цены от ${formatMoney(Math.min(...houseCatalog.map((item) => item.priceFrom)))}`,
        'Фото, площадь и ключевые преимущества'
      ]
    },
    [documentTemplates.checklist.id]: {
      emoji: '✅',
      title: 'Чек-лист подрядчика',
      subtitle: '10 ошибок, которые дорого обходятся',
      bullets: [
        'Помогает быстро проверить подрядчика',
        'В конце сильный акцент на договор и гарантию'
      ]
    },
    [documentTemplates.addonsPriceList.id]: {
      emoji: '💸',
      title: 'Прайс доп. услуг',
      subtitle: 'Блок для расширения сметы и апсейла',
      bullets: [
        'Фундамент, забор, септик, скважина, электричество',
        'Есть ориентир по цене для каждой позиции'
      ]
    },
    [documentTemplates.floorPlan.id]: {
      emoji: '📐',
      title: 'Пример планировки',
      subtitle: floorPlanExample.rooms.join(' · '),
      bullets: [
        'Схема дома с комнатами и зонами',
        'Хорошо работает как вау-эффект перед PDF'
      ]
    },
    [documentTemplates.contract.id]: {
      emoji: '🧾',
      title: 'Договор',
      subtitle: 'Упрощенный демо-договор для доверия',
      bullets: [
        `Срок: ${contractDemo.timelineText}`,
        `Гарантия: ${contractDemo.guaranteeYears} лет`,
        'Содержит стороны, стоимость и порядок приемки'
      ]
    }
  };

  return cards[documentType] || cards[documentTemplates.demoEstimate.id];
}

function getDocumentPreview(documentType, context = {}) {
  const selectedEstimate = context.estimate || buildEstimate({
    areaM2: 100,
    floors: 1,
    packageId: 'standard_shell',
    selectedAddOnIds: [],
    selectedAddOnValues: {},
    wallMaterial: 'gas_block',
    location: 'anapa',
    foundationId: 'strip'
  });

  switch (documentType) {
    case documentTemplates.demoEstimate.id:
      return `Площадь: ${selectedEstimate.areaM2} м²\nИтого: ${formatMoney(selectedEstimate.totalPrice)}\nСрок: ${formatTimelineRange(selectedEstimate.timelineDays)}\n${selectedEstimate.disclaimer}\n${companyProfile.contactsLine}`;
    case documentTemplates.commercialOffer.id:
      return [
        `Компания: ${companyProfile.name}`,
        `Что входит: ${companyProfile.buildingStages.join(', ')}`,
        `Сроки: ${companyProfile.timelines}`,
        `Цена: ${companyProfile.priceFrom}`,
        ...companyProfile.guarantees.map((item) => `✔ ${item}`)
      ].concat([companyProfile.contactsLine]).join('\n');
    case documentTemplates.trimLevels.id:
      return `Базовая, Комфорт и Премиум. Сравнение по фундаменту, отделке и электрике.\n${companyProfile.contactsLine}`;
    case documentTemplates.houseCatalog.id:
      return `${houseCatalog.map((item) => `${item.title} · ${item.areaM2} м² · ${formatMoney(item.priceFrom)}+`).join('\n')}\n${companyProfile.contactsLine}`;
    case documentTemplates.checklist.id:
      return `${contractorChecklist.slice(0, 5).map((item, index) => `${index + 1}. ${item}`).join('\n')}\n${companyProfile.contactsLine}`;
    case documentTemplates.addonsPriceList.id:
      return `${addonPriceList.map((item) => `${item.title}: ${item.value}`).join('\n')}\n${companyProfile.contactsLine}`;
    case documentTemplates.floorPlan.id:
      return `${floorPlanExample.title}\nКомнаты: ${floorPlanExample.rooms.join(', ')}\n${companyProfile.contactsLine}`;
    case documentTemplates.contract.id:
      return `Стороны: ${contractDemo.parties.join(' и ')}\nСроки: ${contractDemo.timelineText}\nГарантия: ${contractDemo.guaranteeYears} лет\n${companyProfile.contactsLine}`;
    default:
      return '';
  }
}

module.exports = {
  buildCommercialDocument,
  getDocumentPreview,
  buildDocumentCard,
  documentTemplates
};
