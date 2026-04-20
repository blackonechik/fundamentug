const {
  packages,
  foundations,
  wallMaterials,
  addons,
  regionConfig
} = require('../data/services');
const { formatMoney, formatTimelineRange } = require('./formatters');

function findPackage(packageId) {
  return packages.find((item) => item.id === packageId) || packages[1];
}

function findFoundation(foundationId) {
  return foundations.find((item) => item.id === foundationId) || foundations[0];
}

function findWallMaterial(wallMaterialId) {
  return wallMaterials.find((item) => item.id === wallMaterialId) || wallMaterials[0];
}

function findAddOn(addOnId) {
  return addons.find((item) => item.id === addOnId);
}

function roundToThousands(value) {
  return Math.round(value / 1000) * 1000;
}

function resolveAddOnPrice(addOn, context) {
  if (addOn.pricingMode === 'per_m2') {
    return roundToThousands(context.areaM2 * addOn.defaultValue);
  }
  if (addOn.pricingMode === 'per_unit') {
    return roundToThousands((context.selectedUnits?.[addOn.id] || 1) * addOn.defaultValue);
  }
  return addOn.defaultValue;
}

function buildEstimate({
  areaM2,
  floors = 1,
  packageId,
  selectedAddOnIds = [],
  selectedAddOnValues = {},
  wallMaterial = 'gas_block',
  location = 'anapa',
  foundationId = 'strip'
}) {
  const selectedPackage = findPackage(packageId);
  const selectedFoundation = findFoundation(foundationId);
  const selectedWallMaterial = findWallMaterial(wallMaterial);

  const assumptions = [...regionConfig.assumptions];
  const lineItems = [];
  const estimatedFlags = [];

  const floorCoefficient = floors === 2 ? 1.08 : 1;
  const basePackageCost = roundToThousands(areaM2 * selectedPackage.baseRatePerM2 * floorCoefficient * selectedWallMaterial.coefficient);
  const packageTimeline = selectedPackage.timelineDays.slice();

  lineItems.push({
    type: 'package',
    title: `${selectedPackage.title} / ${selectedPackage.subtitle}`,
    description: `Базовая ставка ${formatMoney(selectedPackage.baseRatePerM2)} за м²`,
    quantity: areaM2,
    unit: 'м²',
    unitPrice: selectedPackage.baseRatePerM2,
    amount: basePackageCost,
    estimated: selectedPackage.estimated
  });

  if (floors === 2) {
    assumptions.push('Для 2 этажей применен коэффициент 1.08');
  }

  if (selectedWallMaterial.id !== 'gas_block') {
    assumptions.push(`Материал стен: ${selectedWallMaterial.title}`);
  }

  if (selectedFoundation.adjustment > 0) {
    lineItems.push({
      type: 'foundation',
      title: selectedFoundation.title,
      description: selectedFoundation.description,
      quantity: 1,
      unit: 'проект',
      unitPrice: selectedFoundation.adjustment,
      amount: selectedFoundation.adjustment,
      estimated: selectedFoundation.estimated
    });
  }

  const addOnLines = selectedAddOnIds
    .map((addOnId) => findAddOn(addOnId))
    .filter(Boolean)
    .map((addOn) => {
      const quantity = selectedAddOnValues[addOn.id]?.quantity || (addOn.pricingMode === 'per_m2' ? areaM2 : 1);
      const unitPrice = selectedAddOnValues[addOn.id]?.unitPrice || addOn.defaultValue;
      const amount = roundToThousands(
        addOn.pricingMode === 'per_m2'
          ? quantity * unitPrice
          : quantity * unitPrice
      );

      if (addOn.estimated) {
        estimatedFlags.push(addOn.id);
      }

      return {
        type: 'addon',
        title: addOn.title,
        description: addOn.description,
        quantity,
        unit: addOn.unit,
        unitPrice,
        amount,
        estimated: addOn.estimated
      };
    });

  lineItems.push(...addOnLines);

  const totalPrice = lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0);
  const estimated = selectedPackage.estimated || selectedFoundation.estimated || lineItems.some((item) => item.estimated);

  const timelineDays = [
    packageTimeline[0] + selectedFoundation.timelineDays,
    packageTimeline[1] + selectedFoundation.timelineDays + selectedAddOnIds.length * 3
  ];

  return {
    region: location,
    areaM2,
    floors,
    package: selectedPackage,
    foundation: selectedFoundation,
    wallMaterial: selectedWallMaterial,
    lineItems,
    totalPrice,
    estimated,
    estimatedFlags,
    timelineDays,
    assumptions,
    disclaimer: 'Демо-расчет, не является публичной офертой',
    asOfDate: regionConfig.asOfDate
  };
}

function buildEstimateNarrative(estimate) {
  const lines = [];
  lines.push(`Площадь: ${estimate.areaM2} м²`);
  lines.push(`Этажность: ${estimate.floors}`);
  lines.push(`Пакет: ${estimate.package.title} (${estimate.package.subtitle})`);
  lines.push(`Фундамент: ${estimate.foundation.title}`);
  lines.push(`Срок: ${formatTimelineRange(estimate.timelineDays)}`);
  lines.push('');
  lines.push('Состав сметы:');

  estimate.lineItems.forEach((lineItem) => {
    lines.push(`- ${lineItem.title}: ${formatMoney(lineItem.amount)}`);
  });

  return lines.join('\n');
}

function getPackageComparison(areaM2 = 100, floors = 1) {
  return packages.map((item) => {
    const floorCoefficient = floors === 2 ? 1.08 : 1;
    const total = roundToThousands(areaM2 * item.baseRatePerM2 * floorCoefficient);
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      total,
      estimated: item.estimated,
      timelineDays: item.timelineDays,
      includes: item.includes
    };
  });
}

module.exports = {
  buildEstimate,
  buildEstimateNarrative,
  getPackageComparison
};
