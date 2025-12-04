// Document Service - сервис генерации документов
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const documentService = {
  async generateReceiptOrder(data, filename = 'receipt-order.xls') {
    // data: ReceiptOrderData
    return httpService.downloadFile(
      `${API_ENDPOINTS.DOCUMENTS.RECEIPT_ORDER}?${new URLSearchParams(data)}`,
      filename
    );
  },

  async generateShippingInvoice(data, filename = 'shipping-invoice.xls') {
    // data: ShippingInvoiceData
    return httpService.downloadFile(
      `${API_ENDPOINTS.DOCUMENTS.SHIPPING_INVOICE}?${new URLSearchParams(data)}`,
      filename
    );
  },

  async generateInventoryList(data, filename = 'inventory-list.xls') {
    // data: InventoryListData
    return httpService.downloadFile(
      `${API_ENDPOINTS.DOCUMENTS.INVENTORY_LIST}?${new URLSearchParams(data)}`,
      filename
    );
  },

  async generateWriteOffAct(data, filename = 'writeoff-act.docx') {
    // data: WriteOffActData
    return httpService.downloadFile(
      `${API_ENDPOINTS.DOCUMENTS.WRITEOFF_ACT}?${new URLSearchParams(data)}`,
      filename
    );
  },

  async generateRevaluationAct(data, filename = 'revaluation-act.xls') {
    // data: RevaluationActData
    return httpService.downloadFile(
      `${API_ENDPOINTS.DOCUMENTS.REVALUATION_ACT}?${new URLSearchParams(data)}`,
      filename
    );
  },
};

export default documentService;

