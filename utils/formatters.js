function formatMoney(value, locale = 'ru-RU', currency = 'RUB') {
  const normalizedValue = Math.round(value);
  if (currency === 'RUB') {
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0
    }).format(normalizedValue)} ₽`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(normalizedValue);
}

function formatRange(min, max, locale = 'ru-RU', currency = 'RUB') {
  if (min === max) {
    return formatMoney(min, locale, currency);
  }
  return `${formatMoney(min, locale, currency)} - ${formatMoney(max, locale, currency)}`;
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatTimeline(timelineDays) {
  if (!timelineDays) return 'Срок уточняется';
  if (Array.isArray(timelineDays)) {
    return `${timelineDays[0]}-${timelineDays[1]} дней`;
  }
  return `${timelineDays} дней`;
}

function pluralizeDays(days) {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

function formatTimelineRange(daysRange) {
  return `${daysRange[0]}-${daysRange[1]} ${pluralizeDays(daysRange[1])}`;
}

module.exports = {
  formatMoney,
  formatRange,
  formatPercent,
  formatTimeline,
  formatTimelineRange,
  pluralizeDays
};
