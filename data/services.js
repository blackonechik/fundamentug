const regionConfig = {
  regionName: 'Анапа и Анапский район',
  currency: 'RUB',
  locale: 'ru-RU',
  asOfDate: '2026-04-20',
  assumptions: [
    'Цены демонстрационные и не являются офертой',
    'Участок и покупка земли не входят',
    "Для ИЖС используем формулировку 'уведомление', а не 'разрешение'",
    "Если на сайте источника указано только 'от', сохраняем estimated: true"
  ],
  mapLink: 'https://yandex.ru/maps/?text=%D0%90%D0%BD%D0%B0%D0%BF%D0%B0'
};

const packages = [
  {
    id: 'basic_box',
    title: 'Basic',
    subtitle: 'Коробка',
    baseRatePerM2: 32000,
    baseAreaM2: 100,
    timelineDays: [90, 120],
    estimated: false,
    includes: [
      'Изыскания-старт',
      'Базовый фундамент',
      'Несущие стены и перегородки',
      'Кровля'
    ]
  },
  {
    id: 'standard_shell',
    title: 'Standard',
    subtitle: 'Теплый контур + фасад',
    baseRatePerM2: 42500,
    baseAreaM2: 100,
    timelineDays: [140, 180],
    estimated: true,
    includes: [
      'Все из Basic',
      'Окна и входная группа',
      'Фасад и утепление',
      'Черновая электрика и сантехника'
    ]
  },
  {
    id: 'premium_ready',
    title: 'Premium',
    subtitle: 'С отделкой',
    baseRatePerM2: 55000,
    baseAreaM2: 100,
    timelineDays: [180, 240],
    estimated: true,
    includes: [
      'Все из Standard',
      'Внутренняя отделка',
      'Отопление',
      'Чистовая электрика и сантехника',
      'Подготовка к сдаче'
    ]
  }
];

const foundations = [
  {
    id: 'strip',
    title: 'Ленточный фундамент',
    estimated: false,
    adjustment: 0,
    timelineDays: 20,
    description: 'Подходит для простых грунтов и типовых одноэтажных домов'
  },
  {
    id: 'slab',
    title: 'Монолитная плита',
    estimated: false,
    adjustment: 180000,
    timelineDays: 25,
    description: 'Хороший вариант для слабых грунтов и высокой нагрузки'
  },
  {
    id: 'pile_grillage',
    title: 'Свайно-ростверковый',
    estimated: true,
    adjustment: 260000,
    timelineDays: 24,
    description: 'Демо-оценка для сложных оснований'
  }
];

const wallMaterials = [
  { id: 'gas_block', title: 'Газоблок', coefficient: 1.0 },
  { id: 'brick', title: 'Кирпич', coefficient: 1.08 },
  { id: 'cinder_block', title: 'Керамзитоблок', coefficient: 1.03 }
];

const addons = [
  { id: 'geology', title: 'Геология участка', pricingMode: 'fixed', min: 45000, max: 54000, defaultValue: 45000, unit: 'проект', estimated: false, description: 'Исследование грунта перед выбором фундамента' },
  { id: 'project_ar_kr', title: 'Проект АР+КР', pricingMode: 'per_m2', min: 980, max: 980, defaultValue: 980, unit: 'м2', estimated: false, description: 'Архитектура и конструктив для стройки' },
  { id: 'engineering_project', title: 'Инженерный проект', pricingMode: 'per_m2', min: 490, max: 490, defaultValue: 490, unit: 'м2', estimated: false, description: 'Электрика, отопление, ВК' },
  { id: 'foundation_upgrade', title: 'Апгрейд фундамента', pricingMode: 'fixed', min: 120000, max: 550000, defaultValue: 220000, unit: 'проект', estimated: true, description: 'Для сложного грунта или слабого основания' },
  { id: 'septic', title: 'Септик', pricingMode: 'fixed', min: 60000, max: 180000, defaultValue: 95000, unit: 'проект', estimated: true, description: 'Автономная канализация для дома' },
  { id: 'well_water', title: 'Скважина и вода', pricingMode: 'fixed', min: 70000, max: 180000, defaultValue: 85000, unit: 'проект', estimated: true, description: 'Скважина, насос и стартовая разводка' },
  { id: 'gas', title: 'Газификация', pricingMode: 'fixed', min: 203000, max: 300000, defaultValue: 250000, unit: 'проект', estimated: false, description: 'Подключение частного дома к газу' },
  { id: 'paving', title: 'Тротуарная плитка', pricingMode: 'per_m2', min: 1400, max: 4500, defaultValue: 1800, unit: 'м2', estimated: false, description: 'Мощение дорожек и площадок' },
  { id: 'gates', title: 'Откатные ворота', pricingMode: 'fixed', min: 65000, max: 150000, defaultValue: 130000, unit: 'проект', estimated: false, description: 'Готовое решение для въезда' },
  { id: 'supervision_visit', title: 'Технадзор', pricingMode: 'per_unit', min: 3000, max: 11000, defaultValue: 10000, unit: 'выезд', estimated: true, description: 'Контроль строительства и отчетность' }
];

const gallery = [
  { id: 'gallery_01', stage: 'Фундамент', query: 'concrete foundation house construction', imagePath: 'assets/gallery/foundation.jpg' },
  { id: 'gallery_02', stage: 'Кровля', query: 'metal roof installation house', imagePath: 'assets/gallery/roof.jpg' },
  { id: 'gallery_03', stage: 'Фасад', query: 'modern house facade exterior', imagePath: 'assets/gallery/facade.jpg' },
  { id: 'gallery_04', stage: 'Интерьер', query: 'new home interior finishing', imagePath: 'assets/gallery/interior.jpg' },
  { id: 'gallery_05', stage: 'Участок', query: 'house front yard landscaping', imagePath: 'assets/gallery/landscaping.jpg' }
];

const areaOptions = [80, 100, 120, 150];
const floorOptions = [1, 2];

const estimateActions = [
  { text: '➕ Добавить опции', callbackData: 'estimate_addons' },
  { text: '📊 Сравнить с Premium', callbackData: 'compare_premium' },
  { text: '📄 PDF-смета', callbackData: 'send_pdf' },
  { text: '📞 Заказать звонок', callbackData: 'request_callback' },
  { text: '📍 Записать выезд', callbackData: 'schedule_visit' }
];

const companyProfile = {
  name: 'Фундамент Юг',
  logoPath: 'assets/gallery/logo.png',
  legalName: 'ООО "Фундамент Юг"',
  inn: '2844833892',
  address: 'г. Анапа, ул. Гоголя 2А',
  contactsLine: 'ООО "Фундамент Юг", ИНН: 2844833892, г. Анапа, ул. Гоголя 2А',
  shortAbout: 'Строим частные дома в Анапе и Анапском районе по понятной смете, с договором и фиксированной ценой.',
  shortPitch: 'Строительство частных домов в Анапе и Анапском районе под ключ: от сметы до сдачи объекта.',
  buildingStages: ['Фундамент', 'Стены', 'Крыша', 'Окна'],
  timelines: '3–6 месяцев',
  priceFrom: 'от 4 200 000 ₽',
  guarantees: ['Работаем по договору', 'Гарантия 5 лет', 'Фиксированная цена']
};

const documentTemplates = {
  demoEstimate: {
    id: 'demo_estimate',
    title: 'Деморасчёт',
    description: 'Быстрая предварительная смета по площади и выбранной комплектации'
  },
  commercialOffer: {
    id: 'commercial_offer',
    title: 'Коммерческое предложение',
    description: 'Главный продающий документ с логотипом, сроками и ценой от'
  },
  trimLevels: {
    id: 'trim_levels',
    title: 'Комплектации домов',
    description: 'Сравнение базовой, комфорт и премиум комплектаций'
  },
  houseCatalog: {
    id: 'house_catalog',
    title: 'Каталог домов',
    description: 'Подборка готовых проектов с площадью, картинками и ценами'
  },
  checklist: {
    id: 'checklist',
    title: 'Чек-лист подрядчика',
    description: '10 ошибок при выборе строительной компании'
  },
  addonsPriceList: {
    id: 'addons_price_list',
    title: 'Прайс доп. услуг',
    description: 'Фундамент, забор, септик, скважина, электричество и проектирование'
  },
  floorPlan: {
    id: 'floor_plan',
    title: 'Планировка дома',
    description: 'Пример планировки с комнатами и зонами'
  },
  contract: {
    id: 'contract',
    title: 'Договор',
    description: 'Упрощенный демо-договор со сроками, гарантией и стоимостью'
  }
};

const houseCatalog = [
  {
    id: 'house_120',
    title: 'Сканди 120',
    areaM2: 120,
    priceFrom: 4200000,
    imagePath: 'assets/gallery/facade.jpg',
    description: 'Одноэтажный дом с акцентом на свет и простую планировку.',
    highlights: ['3 спальни', 'Кухня-гостиная', 'Терраса']
  },
  {
    id: 'house_98',
    title: 'Комфорт 98',
    areaM2: 98,
    priceFrom: 3900000,
    imagePath: 'assets/gallery/interior.jpg',
    description: 'Компактный дом для семьи из 3-4 человек.',
    highlights: ['2 спальни', 'Санузел', 'Котельная']
  },
  {
    id: 'house_145',
    title: 'Юг 145',
    areaM2: 145,
    priceFrom: 5600000,
    imagePath: 'assets/gallery/roof.jpg',
    description: 'Больше воздуха, больше света и широкая входная группа.',
    highlights: ['4 спальни', 'Гардероб', 'Терраса']
  },
  {
    id: 'house_110',
    title: 'Практик 110',
    areaM2: 110,
    priceFrom: 4500000,
    imagePath: 'assets/gallery/landscaping.jpg',
    description: 'Универсальный проект для участка в Анапе и пригороде.',
    highlights: ['3 спальни', 'Кухня-гостиная', 'Санузел']
  }
];

const contractorChecklist = [
  'Не проверили договор',
  'Нет фиксированной цены',
  'Нет гарантии на работы',
  'Не посмотрели реальные объекты',
  'Не попросили смету по этапам',
  'Не уточнили сроки',
  'Не спросили про материалы',
  'Не проверили опыт прораба',
  'Не запросили контакт технадзора',
  'Выбрали подрядчика только по самой низкой цене'
];

const addonPriceList = [
  { title: 'Фундамент отдельно', value: 'от 180 000 ₽', note: 'зависит от типа и геологии' },
  { title: 'Забор', value: 'от 1 410 ₽/п.м.', note: 'древесина / металл' },
  { title: 'Септик', value: 'от 60 000 ₽', note: 'автономная канализация' },
  { title: 'Скважина', value: 'от 70 000 ₽', note: 'вода и насос' },
  { title: 'Электричество', value: 'от 100 000 ₽', note: 'ввод и разводка' },
  { title: 'Дизайн-проект', value: 'от 980 ₽/м²', note: 'проект АР+КР' }
];

const floorPlanExample = {
  title: 'Пример планировки 100 м²',
  size: '10 x 10 м',
  rooms: ['Кухня-гостиная', 'Спальня', 'Спальня', 'Санузел', 'Котельная', 'Тамбур']
};

const contractDemo = {
  parties: ['Заказчик', 'Подрядчик'],
  sections: ['Предмет договора', 'Сроки', 'Стоимость', 'Гарантия', 'Порядок приемки'],
  guaranteeYears: 5,
  timelineText: '3–6 месяцев',
  amountText: 'от 4 200 000 ₽'
};

module.exports = {
  regionConfig,
  packages,
  foundations,
  wallMaterials,
  addons,
  gallery,
  areaOptions,
  floorOptions,
  estimateActions,
  companyProfile,
  documentTemplates,
  houseCatalog,
  contractorChecklist,
  addonPriceList,
  floorPlanExample,
  contractDemo
};
