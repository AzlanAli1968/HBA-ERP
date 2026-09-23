<?php

use App\Http\Controllers\AccountController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\AccountBalancesController;
use App\Http\Controllers\AccountBalanceReportsController;
use App\Http\Controllers\ReceiptReportsController;
use App\Http\Controllers\JournalVoucherController;
use App\Http\Controllers\CashBankBalanceController;
use App\Http\Controllers\LedgerController;
use App\Http\Controllers\CompanySettingsController;
use App\Http\Controllers\LedgerExportController;
use App\Http\Controllers\ClearanceReportsController;
use App\Http\Controllers\FinancialReportsController;
use App\Http\Controllers\OtherReportsController;
use App\Http\Controllers\SalesReportsController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\Admin\AdminRolesController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\CompanyBankController;
use App\Http\Controllers\WhatsAppBotDocumentController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\QuotationTemplateController;


Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get(
        '/accounts',
        [AccountController::class, 'index']
    )->name('accounts.index');

    Route::post(
        '/accounts',
        [AccountController::class, 'store']
    )->name('accounts.store');

    Route::get(
        '/accounts/{account}',
        [AccountController::class, 'show']
    )->name('accounts.show');

    Route::get(
        '/accounting/receipts/today',
        [ReceiptReportsController::class, 'today']
    )->name('accounting.receipts.today');

    Route::get(
        '/accounting/journal-vouchers/today',
        [JournalVoucherController::class, 'today']
    )->name('accounting.journal-vouchers.today');

    Route::middleware('auth')->group(function (): void {
        Route::get('/admin/users', [AdminUsersController::class, 'index'])
            ->name('admin.users.index');

        Route::post('/admin/users', [AdminUsersController::class, 'store'])
            ->name('admin.users.store');

        Route::put('/admin/users/{user}', [AdminUsersController::class, 'update'])
            ->name('admin.users.update');

        Route::delete('/admin/users/{user}', [AdminUsersController::class, 'destroy'])
            ->name('admin.users.destroy');

        Route::get('/admin/roles', [AdminRolesController::class, 'index'])
            ->name('admin.roles.index');

        Route::post('/admin/roles', [AdminRolesController::class, 'store'])
            ->name('admin.roles.store');

        Route::put('/admin/roles/{role}', [AdminRolesController::class, 'update'])
            ->name('admin.roles.update');

        Route::delete('/admin/roles/{role}', [AdminRolesController::class, 'destroy'])
            ->name('admin.roles.destroy');
    });
});


Route::get(
    '/accounting/ledger',
    [LedgerController::class, 'index']
)->name(
    'accounting.ledger.index'
);

Route::get(
    '/accounting/ledger/print',
    [LedgerController::class, 'print']
)->name('accounting.ledger.print');


Route::get(
    '/accounting/clearance/clientwise',
    [ClearanceReportsController::class, 'clientwise']
)->name('accounting.clearance.clientwise');

Route::get(
    '/accounting/clearance/clientwise/print',
    [ClearanceReportsController::class, 'clientwisePrint']
)->name('accounting.clearance.clientwise.print');

Route::get(
    '/accounting/clearance/clientwise/pdf',
    [ClearanceReportsController::class, 'clientwisePdf']
)->name('accounting.clearance.clientwise.pdf');

Route::get(
    '/accounting/clearance/clientwise/excel',
    [ClearanceReportsController::class, 'clientwiseExcel']
)->name('accounting.clearance.clientwise.excel');


Route::get(
    '/accounting/clearance/difference',
    [ClearanceReportsController::class, 'difference']
)->name('accounting.clearance.difference');

Route::get(
    '/accounting/clearance/difference/print',
    [ClearanceReportsController::class, 'differencePrint']
)->name('accounting.clearance.difference.print');

Route::get(
    '/accounting/clearance/difference/pdf',
    [ClearanceReportsController::class, 'differencePdf']
)->name('accounting.clearance.difference.pdf');

Route::get(
    '/accounting/clearance/difference/excel',
    [ClearanceReportsController::class, 'differenceExcel']
)->name('accounting.clearance.difference.excel');


Route::get(
    '/invoices',
    [InvoiceController::class, 'index']
)->name('invoices.index');

Route::get(
    '/invoices/create',
    [InvoiceController::class, 'create']
)->name('invoices.create');

Route::post(
    '/invoices',
    [InvoiceController::class, 'store']
)->name('invoices.store');

Route::get(
    '/invoices/{invoice}/lines',
    [InvoiceController::class, 'lines']
)->name('invoices.lines');

Route::get(
    '/invoices/{invoice}/print',
    [InvoiceController::class, 'invoicePrint']
)->name('invoices.print');

Route::get(
    '/invoices/{invoice}/pdf',
    [InvoiceController::class, 'invoicePdf']
)->name('invoices.pdf');

Route::get(
    '/invoices/{invoice}/voucher/print',
    [InvoiceController::class, 'voucherPrint']
)->name('invoices.voucher.print');

Route::get(
    '/invoices/{invoice}/voucher/pdf',
    [InvoiceController::class, 'voucherPdf']
)->name('invoices.voucher.pdf');

Route::get(
    '/invoices/{invoice}/edit',
    [InvoiceController::class, 'edit']
)->name('invoices.edit');

Route::get(
    '/invoices/{invoice}',
    [InvoiceController::class, 'show']
)->name('invoices.show');

Route::put(
    '/invoices/{invoice}',
    [InvoiceController::class, 'update']
)->name('invoices.update');

Route::get(
    '/invoices/{invoice}',
    [InvoiceController::class, 'show']
)->name('invoices.show');

Route::put(
    '/invoices/{invoice}',
    [InvoiceController::class, 'update']
)->name('invoices.update');

Route::delete(
    '/invoices/{invoice}',
    [InvoiceController::class, 'destroy']
)->name('invoices.destroy');


Route::get(
    '/reports/sales',
    [SalesReportsController::class, 'index']
)->name('reports.sales');

Route::get(
    '/reports/sales/print',
    [SalesReportsController::class, 'print']
)->name('reports.sales.print');

Route::get(
    '/reports/sales/pdf',
    [SalesReportsController::class, 'pdf']
)->name('reports.sales.pdf');

Route::get(
    '/reports/sales/excel',
    [SalesReportsController::class, 'excel']
)->name('reports.sales.excel');


Route::get(
    '/reports/other',
    [OtherReportsController::class, 'index']
)->name('reports.other');

Route::get(
    '/reports/other/print',
    [OtherReportsController::class, 'print']
)->name('reports.other.print');

Route::get(
    '/reports/other/pdf',
    [OtherReportsController::class, 'pdf']
)->name('reports.other.pdf');

Route::get(
    '/reports/other/excel',
    [OtherReportsController::class, 'excel']
)->name('reports.other.excel');


Route::get(
    '/accounting/ledger/pdf',
    [LedgerController::class, 'pdf']
)->name('accounting.ledger.pdf');

Route::get(
    '/accounting/ledger/excel',
    [LedgerController::class, 'excel']
)->name('accounting.ledger.excel');


Route::get(
    '/admin/settings',
    [CompanySettingsController::class, 'edit']
)->name(
    'admin.settings.edit'
);


Route::put(
    '/admin/settings',
    [CompanySettingsController::class, 'update']
)->name(
    'admin.settings.update'
);

Route::post(
    '/admin/settings/banks',
    [CompanyBankController::class, 'store']
)->name('admin.settings.banks.store');

Route::put(
    '/admin/settings/banks/{bank}',
    [CompanyBankController::class, 'update']
)->name('admin.settings.banks.update');

Route::delete(
    '/admin/settings/banks/{bank}',
    [CompanyBankController::class, 'destroy']
)->name('admin.settings.banks.destroy');


Route::get(
    '/accounting/journal-vouchers/all',
    [JournalVoucherController::class, 'all']
)->name('accounting.journal-vouchers.all');


Route::post(
    '/invoices/options/hotels',
    [InvoiceController::class, 'storeHotel']
)->name('invoices.options.hotels.store');

Route::post(
    '/invoices/options/visa-types',
    [InvoiceController::class, 'storeVisaType']
)->name('invoices.options.visa-types.store');

Route::post(
    '/invoices/options/vehicles',
    [InvoiceController::class, 'storeVehicle']
)->name('invoices.options.vehicles.store');

Route::post(
    '/invoices/options/transfer-locations',
    [InvoiceController::class, 'storeTransferLocation']
)->name('invoices.options.transfer-locations.store');


Route::get(
    '/accounting/journal-vouchers/create',
    [JournalVoucherController::class, 'create']
)->name('accounting.journal-vouchers.create');

Route::post(
    '/accounting/journal-vouchers',
    [JournalVoucherController::class, 'store']
)->name('accounting.journal-vouchers.store');

Route::get(
    '/accounting/journal-vouchers/invoices',
    [JournalVoucherController::class, 'invoices']
)->name(
    'accounting.journal-vouchers.invoices'
);


Route::get(
    '/accounting/payments/today',
    [VoucherController::class, 'todayPayments']
)->name('accounting.payments.today');

Route::get(
    '/accounting/payments/all',
    [VoucherController::class, 'allPayments']
)->name('accounting.payments.all');

Route::delete(
    '/accounting/vouchers/{voucher}',
    [VoucherController::class, 'destroy']
)->name(
    'accounting.vouchers.destroy'
);


Route::get(
    '/reports/financial',
    [FinancialReportsController::class, 'index']
)->name('reports.financial.index');

Route::get(
    '/reports/financial/print',
    [FinancialReportsController::class, 'print']
)->name('reports.financial.print');

Route::get(
    '/reports/financial/pdf',
    [FinancialReportsController::class, 'pdf']
)->name('reports.financial.pdf');

Route::get(
    '/reports/financial/excel',
    [FinancialReportsController::class, 'excel']
)->name('reports.financial.excel');


Route::get(
    '/accounting/cash-bank-balances',
    [CashBankBalanceController::class, 'index']
)->name('accounting.cash-bank-balances.index');

Route::get(
    '/accounting/cash-bank-balances/foreign-currencies',
    [CashBankBalanceController::class, 'foreignCurrencies']
)->name('accounting.cash-bank-balances.foreign-currencies');


Route::delete(
    '/accounting/journal-vouchers/{voucher}',
    [JournalVoucherController::class, 'destroy']
)->name(
    'accounting.journal-vouchers.destroy'
);


Route::get(
    '/accounting/journal-vouchers/{voucher}/edit',
    [JournalVoucherController::class, 'edit']
)->name('accounting.journal-vouchers.edit');

Route::put(
    '/accounting/journal-vouchers/{voucher}',
    [JournalVoucherController::class, 'update']
)->name('accounting.journal-vouchers.update');


Route::get(
    '/accounting/receipts/all',
    [ReceiptReportsController::class, 'all']
)->name('accounting.receipts.all');


Route::get(
    '/accounts/{account}/opening',
    [AccountController::class, 'opening']
)->name('accounts.opening');

Route::get(
    '/accounting/balances/customers/datewise',
    [AccountBalanceReportsController::class, 'customersDatewise']
)->name('accounting.balances.customers.datewise');

Route::get(
    '/accounting/balances/customers/phone',
    [AccountBalanceReportsController::class, 'customersWithPhone']
)->name('accounting.balances.customers.phone');

Route::get(
    '/accounting/balances/customers/foreign',
    [AccountBalanceReportsController::class, 'customersForeign']
)->name('accounting.balances.customers.foreign');

Route::get(
    '/accounting/balances/payables/foreign',
    [AccountBalanceReportsController::class, 'payablesForeign']
)->name('accounting.balances.payables.foreign');


Route::get(
    '/accounting/vouchers',
    [VoucherController::class, 'index']
)->name('accounting.vouchers.index');


Route::get(
    '/accounting/vouchers/create',
    [VoucherController::class, 'create']
)->name('accounting.vouchers.create');

Route::post(
    '/accounting/vouchers',
    [VoucherController::class, 'store']
)->name('accounting.vouchers.store');

Route::get(
    '/accounting/vouchers/{voucher}/edit',
    [VoucherController::class, 'edit']
)->name('accounting.vouchers.edit');

Route::put(
    '/accounting/vouchers/{voucher}',
    [VoucherController::class, 'update']
)->name('accounting.vouchers.update');

Route::get(
    '/accounting/vouchers/invoices',
    [VoucherController::class, 'invoices']
)->name('accounting.vouchers.invoices');


Route::put(
    '/accounts/{account}/opening',
    [AccountController::class, 'updateOpening']
)->name('accounts.opening.update');

Route::get(
    '/accounts/{account}/invoices',
    [AccountController::class, 'invoices']
)->name('accounts.invoices');

Route::get(
    '/accounting/balances/customers',
    [AccountBalancesController::class, 'customers']
)->name('accounting.balances.customers');

Route::get(
    '/accounting/balances/payables',
    [AccountBalancesController::class, 'payables']
)->name('accounting.balances.payables');


Route::put(
    '/accounts/{account}',
    [AccountController::class, 'update']
)->name('accounts.update');



/*
|--------------------------------------------------------------------------
| WhatsApp Bot server-side proxy
|--------------------------------------------------------------------------
|
| Browser â†’ Laravel â†’ Plesk Node.js WhatsApp service
| Node service is exposed by Plesk at:
| http://127.0.0.1:3210
|
*/

Route::middleware(['auth'])->group(function () {

    Route::get('/api/whatsapp-bot/status', function () {
        return Http::timeout(10)
            ->get(
                'http://127.0.0.1:3210/status'
            )
            ->json();
    });

    Route::get('/api/whatsapp-bot/groups', function () {
        return Http::timeout(10)
            ->get(
                'http://127.0.0.1:3210/groups'
            )
            ->json();
    });

    Route::post('/api/whatsapp-bot/start', function () {
        return Http::timeout(10)
            ->post(
                'http://127.0.0.1:3210/start',
                request()->all()
            )
            ->json();
    });

    Route::post('/api/whatsapp-bot/refresh-groups', function () {
        return Http::timeout(10)
            ->post(
                'http://127.0.0.1:3210/refresh-groups',
                request()->all()
            )
            ->json();
    });

    Route::post('/api/whatsapp-bot/select-group', function () {
        return Http::timeout(10)
            ->post(
                'http://127.0.0.1:3210/select-group',
                request()->all()
            )
            ->json();
    });

    Route::post('/api/whatsapp-bot/logout', function () {
        return Http::timeout(10)
            ->post(
                'http://127.0.0.1:3210/logout',
                request()->all()
            )
            ->json();
    });

    Route::post('/api/whatsapp-bot/clear-session', function () {
        return Http::timeout(10)
            ->post(
                'http://127.0.0.1:3210/clear-session',
                request()->all()
            )
            ->json();
    });

});



require __DIR__.'/settings.php';


Route::get(
    '/api/whatsapp-bot/documents/invoice/{reference}/pdf',
    [WhatsAppBotDocumentController::class, 'invoicePdf']
)->whereNumber('reference')
 ->name('whatsapp-bot.documents.invoice.pdf');


Route::get(
    '/api/whatsapp-bot/documents/voucher/{reference}/pdf',
    [WhatsAppBotDocumentController::class, 'voucherPdf']
)->whereNumber('reference')
 ->name('whatsapp-bot.documents.voucher.pdf');


Route::get(
    '/api/whatsapp-bot/documents/ledger/pdf',
    [WhatsAppBotDocumentController::class, 'ledgerPdf']
)->name('whatsapp-bot.documents.ledger.pdf');


Route::get(
    '/api/whatsapp-bot/documents/other-report/pdf',
    [WhatsAppBotDocumentController::class, 'otherReportPdf']
)->name('whatsapp-bot.documents.other-report.pdf');


Route::post(
    '/api/whatsapp-bot/documents/voucher/create',
    [WhatsAppBotDocumentController::class, 'createVoucher']
)
    ->name(
        'whatsapp-bot.documents.voucher.create'
    );


Route::get(
    '/api/whatsapp-bot/accounts/type/{alias}',
    [WhatsAppBotDocumentController::class, 'accountsByType']
)
    ->where('alias', '[A-Za-z]{2}')
    ->name(
        'whatsapp-bot.accounts.type'
    );


Route::post(
    '/api/whatsapp-bot/documents/journal-voucher/create',
    [
        WhatsAppBotDocumentController::class,
        'createJournalVoucher',
    ]
)->name(
    'whatsapp-bot.documents.journal-voucher.create'
);


Route::post(
    '/api/whatsapp-bot/documents/invoice/create',
    [
        WhatsAppBotDocumentController::class,
        'createHotelInvoice',
    ]
)
    ->name(
        'whatsapp-bot.documents.invoice.create'
    );


Route::post(
    '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add',
    [
        WhatsAppBotDocumentController::class,
        'addHotelInvoiceLine',
    ]
)
    ->whereNumber('reference')
    ->name(
        'whatsapp-bot.documents.invoice.hotel.add'
    );


Route::post(
    '/api/whatsapp-bot/documents/invoice/visa/create',
    [
        WhatsAppBotDocumentController::class,
        'createVisaInvoice',
    ]
)->name(
    'whatsapp-bot.documents.invoice.visa.create'
);


Route::post(
    '/api/whatsapp-bot/documents/invoice/{reference}/visa/add',
    [
        WhatsAppBotDocumentController::class,
        'addVisaInvoiceLine',
    ]
)
    ->whereNumber('reference')
    ->name(
        'whatsapp-bot.documents.invoice.visa.add'
    );


Route::post(
    '/api/whatsapp-bot/documents/invoice/transfer/create',
    [
        WhatsAppBotDocumentController::class,
        'createTransferInvoice',
    ]
)->name(
    'whatsapp-bot.documents.invoice.transfer.create'
);


Route::post(
    '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add',
    [
        WhatsAppBotDocumentController::class,
        'addTransferInvoiceLine',
    ]
)
    ->whereNumber('reference')
    ->name(
        'whatsapp-bot.documents.invoice.transfer.add'
    );


/*
|--------------------------------------------------------------------------
| WhatsApp Bot legacy document API aliases
|--------------------------------------------------------------------------
|
| The Node.js bot calls these /whatsapp-bot/... document endpoints.
| Keep them alongside the /api/whatsapp-bot/... routes used by the ERP UI.
|
*/

Route::get(
    '/whatsapp-bot/documents/invoice/{reference}/pdf',
    [WhatsAppBotDocumentController::class, 'invoicePdf']
)->whereNumber('reference')
 ->name('whatsapp-bot.documents.invoice.pdf.legacy');

Route::get(
    '/whatsapp-bot/documents/voucher/{reference}/pdf',
    [WhatsAppBotDocumentController::class, 'voucherPdf']
)->whereNumber('reference')
 ->name('whatsapp-bot.documents.voucher.pdf.legacy');

Route::get(
    '/whatsapp-bot/documents/ledger/pdf',
    [WhatsAppBotDocumentController::class, 'ledgerPdf']
)->name('whatsapp-bot.documents.ledger.pdf.legacy');

Route::get(
    '/whatsapp-bot/documents/other-report/pdf',
    [WhatsAppBotDocumentController::class, 'otherReportPdf']
)->name('whatsapp-bot.documents.other-report.pdf.legacy');

Route::post(
    '/whatsapp-bot/documents/voucher/create',
    [WhatsAppBotDocumentController::class, 'createVoucher']
)
    ->name(
        'whatsapp-bot.documents.voucher.create.legacy'
    );

Route::get(
    '/whatsapp-bot/accounts/type/{alias}',
    [WhatsAppBotDocumentController::class, 'accountsByType']
)
    ->where('alias', '[A-Za-z]{2}')
    ->name(
        'whatsapp-bot.accounts.type.legacy'
    );

Route::post(
    '/whatsapp-bot/documents/journal-voucher/create',
    [
        WhatsAppBotDocumentController::class,
        'createJournalVoucher',
    ]
)->name(
    'whatsapp-bot.documents.journal-voucher.create.legacy'
);

Route::post(
    '/whatsapp-bot/documents/invoice/create',
    [
        WhatsAppBotDocumentController::class,
        'createHotelInvoice',
    ]
)->name(
    'whatsapp-bot.documents.invoice.create.legacy'
);

Route::post(
    '/whatsapp-bot/documents/invoice/{reference}/hotel/add',
    [
        WhatsAppBotDocumentController::class,
        'addHotelInvoiceLine',
    ]
)
    ->whereNumber('reference')
    ->name(
        'whatsapp-bot.documents.invoice.hotel.add.legacy'
    );

Route::post(
    '/whatsapp-bot/documents/invoice/visa/create',
    [
        WhatsAppBotDocumentController::class,
        'createVisaInvoice',
    ]
)->name(
    'whatsapp-bot.documents.invoice.visa.create.legacy'
);

Route::post(
    '/whatsapp-bot/documents/invoice/{reference}/visa/add',
    [
        WhatsAppBotDocumentController::class,
        'addVisaInvoiceLine',
    ]
)
    ->whereNumber('reference')
    ->name(
        'whatsapp-bot.documents.invoice.visa.add.legacy'
    );

Route::post(
    '/whatsapp-bot/documents/invoice/transfer/create',
    [
        WhatsAppBotDocumentController::class,
        'createTransferInvoice',
    ]
)->name(
    'whatsapp-bot.documents.invoice.transfer.create.legacy'
);

Route::get('/quotations', [QuotationController::class, 'index'])
    ->name('quotations.index');

Route::get('/quotations/create', [QuotationController::class, 'create'])
    ->name('quotations.create');

Route::post('/quotations', [QuotationController::class, 'store'])
    ->name('quotations.store');

Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])
    ->name('quotations.show');

Route::get('/quotations/{quotation}/pdf', [QuotationController::class, 'pdf'])
    ->name('quotations.pdf');

Route::get('/quotation-templates', [QuotationTemplateController::class, 'index'])
    ->name('quotation-templates.index');

Route::get('/quotation-templates/create', [QuotationTemplateController::class, 'create'])
    ->name('quotation-templates.create');

Route::post('/quotation-templates', [QuotationTemplateController::class, 'store'])
    ->name('quotation-templates.store');

Route::get('/quotation-templates/{quotationTemplate}/edit', [QuotationTemplateController::class, 'edit'])
    ->name('quotation-templates.edit');

Route::put('/quotation-templates/{quotationTemplate}', [QuotationTemplateController::class, 'update'])
    ->name('quotation-templates.update');

Route::delete('/quotation-templates/{quotationTemplate}', [QuotationTemplateController::class, 'destroy'])
    ->name('quotation-templates.destroy');


Route::post(
    '/whatsapp-bot/documents/invoice/{reference}/transfer/add',
    [
        WhatsAppBotDocumentController::class,
        'addTransferInvoiceLine',
    ]
)
    ->whereNumber('reference')
    ->name(
        'whatsapp-bot.documents.invoice.transfer.add.legacy'
    );



