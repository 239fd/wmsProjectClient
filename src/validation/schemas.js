

import * as yup from 'yup';

const email = yup
    .string()
    .trim()
    .required('Email обязателен')
    .email('Некорректный email');

const password = yup
    .string()
    .required('Пароль обязателен')
    .min(8, 'Минимум 8 символов');

const confirmPassword = (refField = 'password') => yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref(refField)], 'Пароли не совпадают');

const requiredString = (msg) => yup.string().trim().required(msg);
const optionalString = () => yup.string().trim().nullable().transform((v) => (v === '' ? null : v));

const positiveNumber = (msg) => yup
    .number()
    .typeError(msg || 'Должно быть числом')
    .positive(msg || 'Должно быть больше 0')
    .required(msg || 'Обязательное поле');

const nonNegativeNumber = (msg) => yup
    .number()
    .typeError(msg || 'Должно быть числом')
    .min(0, msg || 'Не может быть отрицательным')
    .required(msg || 'Обязательное поле');

const uuid = (msg = 'Некорректный UUID') => yup
    .string()
    .trim()
    .matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, msg)
    .required('Обязательное поле');

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const parseDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

const futureOrTodayDate = (label = 'Дата') => yup
    .string()
    .nullable()
    .transform((v) => (v === '' ? null : v))
    .test('valid-date', `${label} некорректна`, (v) => v == null || parseDate(v) !== null)
    .test('not-past', `${label} не может быть в прошлом`, (v) => {
        if (v == null) return true;
        const d = parseDate(v);
        return d == null || d.getTime() >= startOfToday().getTime();
    });

const requiredFutureOrTodayDate = (label = 'Дата') => futureOrTodayDate(label)
    .required(`${label} обязательна`);

export const loginSchema = yup.object({
    email,
    password: yup.string().required('Введите пароль'),
});

export const registerDirectorSchema = yup.object({
    email,
    lastName: requiredString('Фамилия обязательна'),
    firstName: requiredString('Имя обязательно'),
    middleName: optionalString(),
    password,
    confirmPassword: confirmPassword(),
});

export const registerInvitationSchema = yup.object({
    invitationToken: uuid('Некорректный формат токена'),
    email,
    lastName: requiredString('Фамилия обязательна'),
    firstName: requiredString('Имя обязательно'),
    middleName: optionalString(),
    password,
    confirmPassword: confirmPassword(),
});

export const updateProfileSchema = yup.object({
    email,
    lastName: requiredString('Фамилия обязательна'),
    firstName: requiredString('Имя обязательно'),
    middleName: optionalString(),
});

export const changePasswordSchema = yup.object({
    currentPassword: yup.string().required('Введите текущий пароль'),
    newPassword: password,
    confirmPassword: yup
        .string()
        .required('Подтвердите пароль')
        .oneOf([yup.ref('newPassword')], 'Пароли не совпадают'),
});

export const organizationSchema = yup.object({
    name: requiredString('Полное наименование обязательно'),
    shortName: optionalString(),
    unp: yup.string().trim().required('ИНН обязателен').matches(/^\d{9}$/, 'ИНН — 9 цифр'),
    address: requiredString('Адрес обязателен'),
});

export const supplierSchema = yup.object({
    name: requiredString('Название обязательно'),
    unp: optionalString().matches(/^\d{9}$|^$/, { message: 'ИНН — 9 цифр', excludeEmptyString: true }),
    contactPerson: optionalString(),
    phone: optionalString(),
    email: yup.string().trim().nullable().transform((v) => (v === '' ? null : v))
        .email('Некорректный email'),
    address: optionalString(),
});

export const warehouseSchema = yup.object({
    name: requiredString('Название обязательно'),
    address: requiredString('Адрес обязателен'),
    responsibleUserId: optionalString(),
});

export const rackSchema = yup.object({
    name: requiredString('Название обязательно'),
    kind: yup.string().oneOf(['SHELF', 'CELL', 'FRIDGE', 'PALLET'], 'Выберите тип').required('Тип обязателен'),
    storageConditions: optionalString(),
});

export const shelfSchema = yup.object({
    shelfCapacityKg: positiveNumber('Грузоподъёмность > 0'),
    lengthCm: positiveNumber('Длина > 0'),
    widthCm: positiveNumber('Ширина > 0'),
    heightCm: positiveNumber('Высота > 0'),
});

export const cellSchema = yup.object({
    maxWeightKg: positiveNumber('Грузоподъёмность > 0'),
    lengthCm: positiveNumber('Длина > 0'),
    widthCm: positiveNumber('Ширина > 0'),
    heightCm: positiveNumber('Высота > 0'),
});

export const fridgeSchema = yup.object({
    minTemperatureC: yup.number().typeError('Температура — число').required('Минимум обязателен'),
    maxTemperatureC: yup.number().typeError('Температура — число').required('Максимум обязателен')
        .test('max-gt-min', 'Максимум должен быть больше минимума',
            function (value) { return value === undefined || value > this.parent.minTemperatureC; }),
    lengthCm: positiveNumber('Длина > 0'),
    widthCm: positiveNumber('Ширина > 0'),
    heightCm: positiveNumber('Высота > 0'),
});

export const palletSchema = yup.object({
    palletPlaceCount: yup.number().typeError('Количество — число').integer('Только целое')
        .min(1, 'Минимум 1').required('Количество обязательно'),
    maxWeightKg: positiveNumber('Грузоподъёмность > 0'),
    palletType: yup.string().oneOf(['EUR', 'FIN', 'US', 'ASIA'], 'Выберите тип').required('Тип обязателен'),
});

export const invitationSchema = yup.object({
    email,
    role: yup.string().oneOf(['WORKER', 'ACCOUNTANT'], 'Выберите роль').required('Роль обязательна'),
    warehouseId: requiredString('Склад обязателен — сотрудник привязан к складу'),
});

export const writeOffSchema = yup.object({
    quantity: positiveNumber('Количество > 0'),
    reason: requiredString('Укажите причину'),
    basis: optionalString(),
    responsibleUserId: optionalString(),
    commissionMembers: yup.array().of(yup.string()).default([]),
    cellId: optionalString(),
    batchId: optionalString(),
    notes: optionalString(),
});

export const revaluationSchema = yup.object({
    newPrice: positiveNumber('Цена > 0'),
    reason: optionalString(),
    basis: optionalString(),
    responsibleUserId: optionalString(),
    commissionMembers: yup.array().of(yup.string()).default([]),
    notes: optionalString(),
});

export const supplySchema = yup.object({
    warehouseId: requiredString('Выберите склад'),
    supplierId: optionalString(),
    expectedDate: futureOrTodayDate('Плановая дата поставки'),
    notes: optionalString(),
    items: yup.array().of(
        yup.object({
            productId: requiredString('Товар обязателен'),
            expectedQty: positiveNumber('Количество > 0'),
            unitPrice: yup.number().typeError('Цена — число').min(0, 'Не отрицательная').nullable()
                .transform((v, orig) => (orig === '' || orig === null ? null : v)),
            notes: optionalString(),
        })
    ).min(1, 'Добавьте хотя бы одну позицию').required(),
});

export const shipRequestSchema = yup.object({
    warehouseId: requiredString('Выберите склад'),
    recipientName: optionalString(),
    recipientAddress: optionalString(),
    recipientInn: optionalString(),
    plannedDate: futureOrTodayDate('Плановая дата отгрузки'),
    comment: optionalString(),
    strategy: yup.string().oneOf(['AUTO', 'FIFO', 'FEFO'], 'Выберите стратегию').required('Стратегия обязательна'),
    shipmentType: yup.string().oneOf(['DOMESTIC', 'EXPORT']).default('DOMESTIC'),
    currency: yup.string()
        .matches(/^[A-Z]{3}$/, 'Код валюты — 3 латинские буквы (ISO 4217)')
        .when('shipmentType', {
            is: 'EXPORT',
            then: (s) => s.notOneOf(['BYN'], 'Для экспорта укажите USD/EUR/RUB или другую валюту контракта'),
        })
        .required('Валюта обязательна'),
    documentLayout: yup.string().oneOf(['HORIZONTAL', 'VERTICAL']).default('HORIZONTAL'),
    domesticDocumentKind: yup.string().oneOf(['TN', 'TTN']).default('TN'),
    recipientCountry: optionalString(),
    recipientGln: optionalString(),
    items: yup.array().of(
        yup.object({
            productId: requiredString('Товар обязателен'),
            batchId: optionalString(),
            expectedQty: positiveNumber('Количество > 0'),
        })
    ).min(1, 'Добавьте хотя бы одну позицию').required(),
});

export const receiveSchema = yup.object({
    warehouseId: requiredString('Выберите склад'),
    productId: requiredString('Выберите товар'),
    rackId: optionalString(),
    placeId: optionalString(),
    quantity: positiveNumber('Количество > 0'),
    batchNumber: optionalString(),
    expiryDate: futureOrTodayDate('Срок годности'),
    pricePerUnit: nonNegativeNumber('Цена не отрицательная'),
    supplierId: optionalString(),
    supplyId: optionalString(),
});

export const productCreateSchema = yup.object({
    name: requiredString('Название обязательно'),
    sku: optionalString().max(100, 'SKU не более 100 символов'),
    barcode: optionalString().max(100, 'Штрих-код не более 100 символов'),
    category: optionalString().max(100, 'Категория не более 100 символов'),
    unitOfMeasure: optionalString().max(50, 'Ед. измерения не более 50 символов'),
    description: optionalString(),
    weightKg: yup.number().typeError('Вес — число').min(0, 'Не отрицательный').nullable()
        .transform((v, orig) => (orig === '' || orig === null ? null : v)),
    volumeM3: yup.number().typeError('Объём — число').min(0, 'Не отрицательный').nullable()
        .transform((v, orig) => (orig === '' || orig === null ? null : v)),
});

export const receiveWizardSchema = yup.object({
    warehouseId: requiredString('Выберите склад'),
    supplierId: optionalString(),
    supplyId: optionalString(),
    items: yup.array().of(
        yup.object({
            productId: requiredString('Выберите товар'),
            quantity: positiveNumber('Количество > 0'),
            pricePerUnit: positiveNumber('Цена > 0'),
            batchId: optionalString(),
            batchNumber: requiredString('№ партии обязателен'),
            expiryDate: requiredFutureOrTodayDate('Срок годности'),
            cellId: optionalString(),
            notes: optionalString(),
        })
    ).min(1, 'Добавьте хотя бы один товар').required(),
});

export const inventoryStartSchema = yup.object({
    warehouseId: requiredString('Выберите склад'),
    responsibleUserId: optionalString(),
    reason: optionalString(),
    notes: optionalString(),
});

export const inventoryRecordSchema = yup.object({
    productId: requiredString('Товар обязателен'),
    cellId: optionalString(),
    actualQuantity: nonNegativeNumber('Количество не отрицательное'),
    notes: optionalString(),
});

export const erpRunSchema = yup.object({
    mode: yup.string().oneOf(['api', 'rpa'], 'Выберите режим').required('Режим обязателен'),
});
