import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
export const invoicePdf = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf.url(args, options),
    method: 'get',
})

invoicePdf.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/invoice/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reference: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    reference: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reference: args.reference,
                }

    return invoicePdf.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoicePdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
    const invoicePdfForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoicePdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
        invoicePdfForm.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
        invoicePdfForm.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    invoicePdf.form = invoicePdfForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
export const voucherPdf = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdf.url(args, options),
    method: 'get',
})

voucherPdf.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/voucher/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdf.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reference: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    reference: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reference: args.reference,
                }

    return voucherPdf.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdf.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdf.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: voucherPdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
    const voucherPdfForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: voucherPdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        voucherPdfForm.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        voucherPdfForm.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdf.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    voucherPdf.form = voucherPdfForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
export const ledgerPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ledgerPdf.url(options),
    method: 'get',
})

ledgerPdf.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/ledger/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdf.url = (options?: RouteQueryOptions) => {
    return ledgerPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ledgerPdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ledgerPdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
    const ledgerPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ledgerPdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
        ledgerPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ledgerPdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
        ledgerPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ledgerPdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ledgerPdf.form = ledgerPdfForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
export const otherReportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: otherReportPdf.url(options),
    method: 'get',
})

otherReportPdf.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/other-report/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdf.url = (options?: RouteQueryOptions) => {
    return otherReportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: otherReportPdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: otherReportPdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
    const otherReportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: otherReportPdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
        otherReportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: otherReportPdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
        otherReportPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: otherReportPdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    otherReportPdf.form = otherReportPdfForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
export const createVoucher = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVoucher.url(options),
    method: 'post',
})

createVoucher.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
createVoucher.url = (options?: RouteQueryOptions) => {
    return createVoucher.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
createVoucher.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVoucher.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
    const createVoucherForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createVoucher.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
        createVoucherForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createVoucher.url(options),
            method: 'post',
        })
    
    createVoucher.form = createVoucherForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
export const accountsByType = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsByType.url(args, options),
    method: 'get',
})

accountsByType.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/accounts/type/{alias}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType.url = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { alias: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    alias: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        alias: args.alias,
                }

    return accountsByType.definition.url
            .replace('{alias}', parsedArgs.alias.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsByType.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: accountsByType.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
    const accountsByTypeForm = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: accountsByType.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
        accountsByTypeForm.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountsByType.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
        accountsByTypeForm.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountsByType.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    accountsByType.form = accountsByTypeForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
export const createJournalVoucher = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createJournalVoucher.url(options),
    method: 'post',
})

createJournalVoucher.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/journal-voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
createJournalVoucher.url = (options?: RouteQueryOptions) => {
    return createJournalVoucher.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
createJournalVoucher.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createJournalVoucher.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
    const createJournalVoucherForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createJournalVoucher.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
        createJournalVoucherForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createJournalVoucher.url(options),
            method: 'post',
        })
    
    createJournalVoucher.form = createJournalVoucherForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1657
 * @route '/whatsapp-bot/documents/invoice/create'
 */
export const createHotelInvoice = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createHotelInvoice.url(options),
    method: 'post',
})

createHotelInvoice.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1657
 * @route '/whatsapp-bot/documents/invoice/create'
 */
createHotelInvoice.url = (options?: RouteQueryOptions) => {
    return createHotelInvoice.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1657
 * @route '/whatsapp-bot/documents/invoice/create'
 */
createHotelInvoice.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createHotelInvoice.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1657
 * @route '/whatsapp-bot/documents/invoice/create'
 */
    const createHotelInvoiceForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createHotelInvoice.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1657
 * @route '/whatsapp-bot/documents/invoice/create'
 */
        createHotelInvoiceForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createHotelInvoice.url(options),
            method: 'post',
        })
    
    createHotelInvoice.form = createHotelInvoiceForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1712
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
export const addHotelInvoiceLine = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addHotelInvoiceLine.url(args, options),
    method: 'post',
})

addHotelInvoiceLine.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/hotel/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1712
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
addHotelInvoiceLine.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reference: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    reference: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reference: args.reference,
                }

    return addHotelInvoiceLine.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1712
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
addHotelInvoiceLine.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addHotelInvoiceLine.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1712
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
    const addHotelInvoiceLineForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addHotelInvoiceLine.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1712
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
        addHotelInvoiceLineForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addHotelInvoiceLine.url(args, options),
            method: 'post',
        })
    
    addHotelInvoiceLine.form = addHotelInvoiceLineForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
export const createVisaInvoice = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVisaInvoice.url(options),
    method: 'post',
})

createVisaInvoice.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/visa/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
createVisaInvoice.url = (options?: RouteQueryOptions) => {
    return createVisaInvoice.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
createVisaInvoice.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVisaInvoice.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
    const createVisaInvoiceForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createVisaInvoice.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
        createVisaInvoiceForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createVisaInvoice.url(options),
            method: 'post',
        })
    
    createVisaInvoice.form = createVisaInvoiceForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
export const addVisaInvoiceLine = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addVisaInvoiceLine.url(args, options),
    method: 'post',
})

addVisaInvoiceLine.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/visa/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
addVisaInvoiceLine.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reference: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    reference: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reference: args.reference,
                }

    return addVisaInvoiceLine.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
addVisaInvoiceLine.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addVisaInvoiceLine.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
    const addVisaInvoiceLineForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addVisaInvoiceLine.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
        addVisaInvoiceLineForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addVisaInvoiceLine.url(args, options),
            method: 'post',
        })
    
    addVisaInvoiceLine.form = addVisaInvoiceLineForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1889
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
export const createTransferInvoice = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTransferInvoice.url(options),
    method: 'post',
})

createTransferInvoice.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/transfer/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1889
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
createTransferInvoice.url = (options?: RouteQueryOptions) => {
    return createTransferInvoice.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1889
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
createTransferInvoice.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTransferInvoice.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1889
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
    const createTransferInvoiceForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createTransferInvoice.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1889
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
        createTransferInvoiceForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createTransferInvoice.url(options),
            method: 'post',
        })
    
    createTransferInvoice.form = createTransferInvoiceForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1938
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
export const addTransferInvoiceLine = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addTransferInvoiceLine.url(args, options),
    method: 'post',
})

addTransferInvoiceLine.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/transfer/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1938
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
addTransferInvoiceLine.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reference: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    reference: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reference: args.reference,
                }

    return addTransferInvoiceLine.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1938
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
addTransferInvoiceLine.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addTransferInvoiceLine.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1938
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
    const addTransferInvoiceLineForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addTransferInvoiceLine.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1938
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
        addTransferInvoiceLineForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addTransferInvoiceLine.url(args, options),
            method: 'post',
        })
    
    addTransferInvoiceLine.form = addTransferInvoiceLineForm
const WhatsAppBotDocumentController = { invoicePdf, voucherPdf, ledgerPdf, otherReportPdf, createVoucher, accountsByType, createJournalVoucher, createHotelInvoice, addHotelInvoiceLine, createVisaInvoice, addVisaInvoiceLine, createTransferInvoice, addTransferInvoiceLine }

export default WhatsAppBotDocumentController