export const ENUM_LABELS = {
  UserRole: {
    WORKER:     { label: 'Кладовщик',  color: 'default' },
    ACCOUNTANT: { label: 'Бухгалтер', color: 'info' },
    DIRECTOR:   { label: 'Заведующий',  color: 'primary' },
  },

  OrganizationStatus: {
    ACTIVE:   { label: 'Активна',   color: 'success' },
    ARCHIVED: { label: 'В архиве',  color: 'default' },
  },

  RackKind: {
    SHELF:  { label: 'Стеллаж', color: 'default' },
    CELL:   { label: 'Ячейка',  color: 'default' },
    FRIDGE: { label: 'Холодильник', color: 'info' },
    PALLET: { label: 'Паллетоместо', color: 'default' },
  },

  StorageConditions: {
    AMBIENT: { label: 'Сухое (обычная)', color: 'default' },
    DRY:     { label: 'Сухое',           color: 'default' },
    FRIDGE:  { label: 'Холодильник',     color: 'info'    },
    FREEZER: { label: 'Морозильник',     color: 'primary' },
  },

  OperationStatus: {
    PENDING:                     { label: 'Ожидает',                  color: 'default' },
    RECEIVED:                    { label: 'Принята',                  color: 'success' },
    PAUSED:                      { label: 'На утверждении',           color: 'warning' },
    COMPLETED:                   { label: 'Завершена',                color: 'success' },
    COMPLETED_WITH_DISCREPANCY:  { label: 'Завершена с расхождением', color: 'warning' },
    CANCELLED:                   { label: 'Отменена',                 color: 'default' },
  },

  OperationType: {
    RECEIPT:     { label: 'Приёмка',     color: 'info'    },
    SHIPMENT:    { label: 'Отгрузка',    color: 'primary' },
    STAGING:     { label: 'Стейджинг',   color: 'default' },
    TRANSFER:    { label: 'Перемещение', color: 'default' },
    WRITE_OFF:   { label: 'Списание',    color: 'error'   },
    REVALUATION: { label: 'Переоценка',  color: 'warning' },
    INVENTORY:   { label: 'Инвентаризация', color: 'info' },
  },

  InventoryStatus: {
    AVAILABLE:  { label: 'Доступен',  color: 'success' },
    RESERVED:   { label: 'Зарезервирован', color: 'info' },
    DAMAGED:    { label: 'Повреждён', color: 'error'   },
    EXPIRED:    { label: 'Просрочен', color: 'warning' },
    IN_TRANSIT: { label: 'В пути',    color: 'info'    },
  },

  InventoryEventType: {
    ITEM_ADDED:   { label: 'Добавлен',  color: 'success' },
    ITEM_REMOVED: { label: 'Удалён',    color: 'error'   },
    REVALUED:     { label: 'Переоценён', color: 'warning' },
    WRITTEN_OFF:  { label: 'Списан',    color: 'default' },
  },

  ReceiptSessionStatus: {
    PAUSED:                     { label: 'На утверждении',           color: 'warning' },
    COMPLETED:                  { label: 'Завершена',                color: 'success' },
    COMPLETED_WITH_DISCREPANCY: { label: 'Завершена с расхождением', color: 'warning' },
  },

  ShipmentRequestStatus: {
    PLANNED:   { label: 'Запланирована', color: 'default' },
    PICKING:   { label: 'Подбор',        color: 'warning' },
    COMPLETED: { label: 'Завершена',     color: 'success' },
    CANCELLED: { label: 'Отменена',      color: 'error'   },
  },

  ShipmentType: {
    DOMESTIC: { label: 'Внутренняя', color: 'default' },
    EXPORT:   { label: 'Экспорт',    color: 'primary' },
  },

  DocumentLayout: {
    HORIZONTAL: { label: 'Горизонтальная', color: 'default' },
    VERTICAL:   { label: 'Вертикальная',   color: 'default' },
  },

  DomesticDocumentKind: {
    TN:  { label: 'ТН-2',  color: 'default' },
    TTN: { label: 'ТТН-1', color: 'default' },
  },

  AllocationStrategy: {
    AUTO: { label: 'AUTO — авто-выбор партии',  color: 'default' },
    FEFO: { label: 'FEFO — first expired first out', color: 'default' },
    FIFO: { label: 'FIFO — first in first out', color: 'default' },
  },

  SupplyStatus: {
    PLANNED:     { label: 'Запланирована', color: 'default' },
    IN_PROGRESS: { label: 'В пути',        color: 'info'    },
    ACCEPTED:    { label: 'Принята',       color: 'success' },
    REJECTED:    { label: 'Отклонена',     color: 'error'   },
    CANCELLED:   { label: 'Отменена',      color: 'default' },
  },

  SagaStatus: {
    PENDING:             { label: 'Выполняется',  color: 'info'    },
    COMPLETED:           { label: 'Завершена',    color: 'success' },
    FAILED:              { label: 'Ошибка',       color: 'error'   },
    COMPENSATING:        { label: 'Откат',        color: 'warning' },
    COMPENSATED:         { label: 'Откачено',     color: 'default' },
    COMPENSATION_FAILED: { label: 'Откат провален', color: 'error' },
  },

  SagaType: {
    RECEIVE: { label: 'Приёмка',  color: 'info' },
    SHIP:    { label: 'Отгрузка', color: 'primary' },
  },

  AuthProvider: {
    LOCAL:  { label: 'Локальный', color: 'default' },
    GOOGLE: { label: 'Google',    color: 'default' },
    YANDEX: { label: 'Yandex',    color: 'default' },
  },

  PalletType: {
    EUR:  { label: 'EUR (800×1200×145)', color: 'default' },
    FIN:  { label: 'FIN (1000×1200×145)', color: 'default' },
    US:   { label: 'US (1200×1200×145)',  color: 'default' },
    ASIA: { label: 'ASIA (1100×1100×145)', color: 'default' },
  },
};

export function enumLabel(group, value) {
  if (value == null || value === '') return '—';
  const entry = ENUM_LABELS[group]?.[value];
  return entry ? entry.label : String(value);
}

export function enumColor(group, value, fallback = 'default') {
  if (value == null || value === '') return fallback;
  return ENUM_LABELS[group]?.[value]?.color || fallback;
}

export function enumChipProps(group, value) {
  if (value == null || value === '') return { label: '—', color: 'default' };
  const entry = ENUM_LABELS[group]?.[value];
  return {
    label: entry ? entry.label : String(value),
    color: entry ? entry.color : 'default',
  };
}
