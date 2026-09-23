import DashboardController from './DashboardController'
import AccountController from './AccountController'
import ReceiptReportsController from './ReceiptReportsController'
import JournalVoucherController from './JournalVoucherController'
import Admin from './Admin'
import LedgerController from './LedgerController'
import ClearanceReportsController from './ClearanceReportsController'
import InvoiceController from './InvoiceController'
import SalesReportsController from './SalesReportsController'
import OtherReportsController from './OtherReportsController'
import CompanySettingsController from './CompanySettingsController'
import CompanyBankController from './CompanyBankController'
import VoucherController from './VoucherController'
import FinancialReportsController from './FinancialReportsController'
import CashBankBalanceController from './CashBankBalanceController'
import AccountBalanceReportsController from './AccountBalanceReportsController'
import AccountBalancesController from './AccountBalancesController'
import Settings from './Settings'
import WhatsAppBotDocumentController from './WhatsAppBotDocumentController'
import QuotationController from './QuotationController'
import QuotationTemplateController from './QuotationTemplateController'
const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
AccountController: Object.assign(AccountController, AccountController),
ReceiptReportsController: Object.assign(ReceiptReportsController, ReceiptReportsController),
JournalVoucherController: Object.assign(JournalVoucherController, JournalVoucherController),
Admin: Object.assign(Admin, Admin),
LedgerController: Object.assign(LedgerController, LedgerController),
ClearanceReportsController: Object.assign(ClearanceReportsController, ClearanceReportsController),
InvoiceController: Object.assign(InvoiceController, InvoiceController),
SalesReportsController: Object.assign(SalesReportsController, SalesReportsController),
OtherReportsController: Object.assign(OtherReportsController, OtherReportsController),
CompanySettingsController: Object.assign(CompanySettingsController, CompanySettingsController),
CompanyBankController: Object.assign(CompanyBankController, CompanyBankController),
VoucherController: Object.assign(VoucherController, VoucherController),
FinancialReportsController: Object.assign(FinancialReportsController, FinancialReportsController),
CashBankBalanceController: Object.assign(CashBankBalanceController, CashBankBalanceController),
AccountBalanceReportsController: Object.assign(AccountBalanceReportsController, AccountBalanceReportsController),
AccountBalancesController: Object.assign(AccountBalancesController, AccountBalancesController),
Settings: Object.assign(Settings, Settings),
WhatsAppBotDocumentController: Object.assign(WhatsAppBotDocumentController, WhatsAppBotDocumentController),
QuotationController: Object.assign(QuotationController, QuotationController),
QuotationTemplateController: Object.assign(QuotationTemplateController, QuotationTemplateController),
}

export default Controllers