const { areaOptions, floorOptions, packages, foundations, addons, estimateActions } = require('../data/services');

function startKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🏗 Рассчитать дом', callback_data: 'flow_calc' }],
      [{ text: '📚 Документы', callback_data: 'flow_documents' }],
      [{ text: '🧩 Доп. услуги', callback_data: 'flow_addons' }],
      [{ text: '📍 Записать выезд', callback_data: 'schedule_visit' }],
    ]
  };
}

function locationKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Анапа', callback_data: 'location_anapa' }, { text: 'Анапский район', callback_data: 'location_district' }],
      [{ text: 'Пока не знаю', callback_data: 'location_unknown' }]
    ]
  };
}

function areaKeyboard() {
  return {
    inline_keyboard: [
      areaOptions.slice(0, 2).map((area) => ({ text: `${area} м²`, callback_data: `area_${area}` })),
      areaOptions.slice(2).map((area) => ({ text: `${area} м²`, callback_data: `area_${area}` }))
    ]
  };
}

function floorKeyboard() {
  return {
    inline_keyboard: floorOptions.map((floors) => ([{ text: `${floors} этаж${floors > 1 ? 'а' : ''}`, callback_data: `floors_${floors}` }]))
  };
}

function packageKeyboard() {
  return {
    inline_keyboard: packages.map((item) => ([{ text: `${item.title} · ${item.subtitle}`, callback_data: `package_${item.id}` }]))
  };
}

function foundationKeyboard() {
  return {
    inline_keyboard: foundations.map((item) => ([{ text: item.title, callback_data: `foundation_${item.id}` }]))
  };
}

function addonKeyboard(selectedAddOnIds = []) {
  const rows = addons.map((item) => ([
    {
      text: `${selectedAddOnIds.includes(item.id) ? '✅ ' : ''}${item.title}`,
      callback_data: `addon_toggle_${item.id}`
    }
  ]));
  rows.push([{ text: '♻ Сбросить выбор', callback_data: 'addons_reset' }]);
  rows.push([{ text: 'Готово', callback_data: 'addons_done' }]);
  return { inline_keyboard: rows };
}

function estimateActionsKeyboard() {
  return {
    inline_keyboard: estimateActions.map((item) => ([{ text: item.text, callback_data: item.callbackData }]))
  };
}

function compareKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Показать текущий расчет', callback_data: 'flow_calc' }],
      [{ text: 'Сразу сравнить', callback_data: 'compare_show' }],
      [{ text: 'В меню', callback_data: 'back_start' }]
    ]
  };
}

function visitSlotsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Вт 11:00', callback_data: 'visit_slot_tue_11' }, { text: 'Чт 15:00', callback_data: 'visit_slot_thu_15' }],
      [{ text: 'Сб 12:00', callback_data: 'visit_slot_sat_12' }, { text: 'Вс 10:00', callback_data: 'visit_slot_sun_10' }],
      [{ text: 'Назад', callback_data: 'back_start' }]
    ]
  };
}

function callbackKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Оставить телефон', callback_data: 'callback_confirm' }],
      [{ text: 'В меню', callback_data: 'back_start' }]
    ]
  };
}

function phoneRequestKeyboard() {
  return {
    keyboard: [
      [{ text: '📱 Отправить номер телефона', request_contact: true }],
      [{ text: 'В меню' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
    input_field_placeholder: 'Нажмите кнопку или напишите номер'
  };
}

function addressRequestKeyboard() {
  return {
    keyboard: [
      [{ text: '📍 Отправить адрес', request_location: true }],
      [{ text: 'В меню' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
    input_field_placeholder: 'Нажмите кнопку или напишите адрес'
  };
}

function removeKeyboard() {
  return { remove_keyboard: true };
}

function documentsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: 'Деморасчёт', callback_data: 'doc_demo_estimate' }],
      [{ text: 'Коммерческое предложение', callback_data: 'doc_commercial_offer' }],
      [{ text: 'Комплектации домов', callback_data: 'doc_trim_levels' }],
      [{ text: 'Каталог домов', callback_data: 'doc_house_catalog' }],
      [{ text: 'Чек-лист подрядчика', callback_data: 'doc_checklist' }],
      [{ text: 'Прайс доп. услуг', callback_data: 'doc_addons_price_list' }],
      [{ text: 'Пример планировки', callback_data: 'doc_floor_plan' }],
      [{ text: 'Договор', callback_data: 'doc_contract' }],
      [{ text: 'В меню', callback_data: 'back_start' }]
    ]
  };
}

module.exports = {
  startKeyboard,
  locationKeyboard,
  areaKeyboard,
  floorKeyboard,
  packageKeyboard,
  foundationKeyboard,
  addonKeyboard,
  estimateActionsKeyboard,
  compareKeyboard,
  visitSlotsKeyboard,
  callbackKeyboard,
  phoneRequestKeyboard,
  addressRequestKeyboard,
  removeKeyboard,
  documentsKeyboard
};
