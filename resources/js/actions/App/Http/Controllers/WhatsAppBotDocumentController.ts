import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
const invoicePdf5789f94d8b8228aab152e97569b1afcc = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf5789f94d8b8228aab152e97569b1afcc.url(args, options),
    method: 'get',
})

invoicePdf5789f94d8b8228aab152e97569b1afcc.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/documents/invoice/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf5789f94d8b8228aab152e97569b1afcc.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return invoicePdf5789f94d8b8228aab152e97569b1afcc.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf5789f94d8b8228aab152e97569b1afcc.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf5789f94d8b8228aab152e97569b1afcc.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf5789f94d8b8228aab152e97569b1afcc.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoicePdf5789f94d8b8228aab152e97569b1afcc.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
    const invoicePdf5789f94d8b8228aab152e97569b1afccForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoicePdf5789f94d8b8228aab152e97569b1afcc.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
        invoicePdf5789f94d8b8228aab152e97569b1afccForm.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf5789f94d8b8228aab152e97569b1afcc.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
        invoicePdf5789f94d8b8228aab152e97569b1afccForm.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf5789f94d8b8228aab152e97569b1afcc.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    invoicePdf5789f94d8b8228aab152e97569b1afcc.form = invoicePdf5789f94d8b8228aab152e97569b1afccForm
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
const invoicePdf539be542188a475d5a9d4082f68ceec8 = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf539be542188a475d5a9d4082f68ceec8.url(args, options),
    method: 'get',
})

invoicePdf539be542188a475d5a9d4082f68ceec8.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/invoice/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf539be542188a475d5a9d4082f68ceec8.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return invoicePdf539be542188a475d5a9d4082f68ceec8.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf539be542188a475d5a9d4082f68ceec8.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf539be542188a475d5a9d4082f68ceec8.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
invoicePdf539be542188a475d5a9d4082f68ceec8.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoicePdf539be542188a475d5a9d4082f68ceec8.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
    const invoicePdf539be542188a475d5a9d4082f68ceec8Form = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoicePdf539be542188a475d5a9d4082f68ceec8.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
        invoicePdf539be542188a475d5a9d4082f68ceec8Form.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf539be542188a475d5a9d4082f68ceec8.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:15
 * @route '/whatsapp-bot/documents/invoice/{reference}/pdf'
 */
        invoicePdf539be542188a475d5a9d4082f68ceec8Form.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf539be542188a475d5a9d4082f68ceec8.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    invoicePdf539be542188a475d5a9d4082f68ceec8.form = invoicePdf539be542188a475d5a9d4082f68ceec8Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::invoicePdf, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `invoicePdf['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const invoicePdf = {
    '/api/whatsapp-bot/documents/invoice/{reference}/pdf': invoicePdf5789f94d8b8228aab152e97569b1afcc,
    '/whatsapp-bot/documents/invoice/{reference}/pdf': invoicePdf539be542188a475d5a9d4082f68ceec8,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
const voucherPdf515a9f29a3e1ba02deee53871d82f520 = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdf515a9f29a3e1ba02deee53871d82f520.url(args, options),
    method: 'get',
})

voucherPdf515a9f29a3e1ba02deee53871d82f520.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/documents/voucher/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdf515a9f29a3e1ba02deee53871d82f520.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return voucherPdf515a9f29a3e1ba02deee53871d82f520.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdf515a9f29a3e1ba02deee53871d82f520.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdf515a9f29a3e1ba02deee53871d82f520.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdf515a9f29a3e1ba02deee53871d82f520.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: voucherPdf515a9f29a3e1ba02deee53871d82f520.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
    const voucherPdf515a9f29a3e1ba02deee53871d82f520Form = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: voucherPdf515a9f29a3e1ba02deee53871d82f520.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        voucherPdf515a9f29a3e1ba02deee53871d82f520Form.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdf515a9f29a3e1ba02deee53871d82f520.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        voucherPdf515a9f29a3e1ba02deee53871d82f520Form.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdf515a9f29a3e1ba02deee53871d82f520.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    voucherPdf515a9f29a3e1ba02deee53871d82f520.form = voucherPdf515a9f29a3e1ba02deee53871d82f520Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
const voucherPdfc47475303b1317f832ca1d847f31e0de = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdfc47475303b1317f832ca1d847f31e0de.url(args, options),
    method: 'get',
})

voucherPdfc47475303b1317f832ca1d847f31e0de.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/voucher/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdfc47475303b1317f832ca1d847f31e0de.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return voucherPdfc47475303b1317f832ca1d847f31e0de.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdfc47475303b1317f832ca1d847f31e0de.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdfc47475303b1317f832ca1d847f31e0de.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
voucherPdfc47475303b1317f832ca1d847f31e0de.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: voucherPdfc47475303b1317f832ca1d847f31e0de.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
    const voucherPdfc47475303b1317f832ca1d847f31e0deForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: voucherPdfc47475303b1317f832ca1d847f31e0de.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        voucherPdfc47475303b1317f832ca1d847f31e0deForm.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdfc47475303b1317f832ca1d847f31e0de.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        voucherPdfc47475303b1317f832ca1d847f31e0deForm.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdfc47475303b1317f832ca1d847f31e0de.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    voucherPdfc47475303b1317f832ca1d847f31e0de.form = voucherPdfc47475303b1317f832ca1d847f31e0deForm

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::voucherPdf, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `voucherPdf['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const voucherPdf = {
    '/api/whatsapp-bot/documents/voucher/{reference}/pdf': voucherPdf515a9f29a3e1ba02deee53871d82f520,
    '/whatsapp-bot/documents/voucher/{reference}/pdf': voucherPdfc47475303b1317f832ca1d847f31e0de,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
const ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url(options),
    method: 'get',
})

ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/documents/ledger/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url = (options?: RouteQueryOptions) => {
    return ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
    const ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
        ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/api/whatsapp-bot/documents/ledger/pdf'
 */
        ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39.form = ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
const ledgerPdfde04b6573b371d812545e18c44c19390 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ledgerPdfde04b6573b371d812545e18c44c19390.url(options),
    method: 'get',
})

ledgerPdfde04b6573b371d812545e18c44c19390.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/ledger/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdfde04b6573b371d812545e18c44c19390.url = (options?: RouteQueryOptions) => {
    return ledgerPdfde04b6573b371d812545e18c44c19390.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdfde04b6573b371d812545e18c44c19390.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ledgerPdfde04b6573b371d812545e18c44c19390.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
ledgerPdfde04b6573b371d812545e18c44c19390.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ledgerPdfde04b6573b371d812545e18c44c19390.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
    const ledgerPdfde04b6573b371d812545e18c44c19390Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: ledgerPdfde04b6573b371d812545e18c44c19390.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
        ledgerPdfde04b6573b371d812545e18c44c19390Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ledgerPdfde04b6573b371d812545e18c44c19390.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1309
 * @route '/whatsapp-bot/documents/ledger/pdf'
 */
        ledgerPdfde04b6573b371d812545e18c44c19390Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: ledgerPdfde04b6573b371d812545e18c44c19390.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    ledgerPdfde04b6573b371d812545e18c44c19390.form = ledgerPdfde04b6573b371d812545e18c44c19390Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::ledgerPdf, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `ledgerPdf['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const ledgerPdf = {
    '/api/whatsapp-bot/documents/ledger/pdf': ledgerPdfbe5288a2c57d53040b25b77bbd1d7c39,
    '/whatsapp-bot/documents/ledger/pdf': ledgerPdfde04b6573b371d812545e18c44c19390,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
const otherReportPdf61b75923afd9e5155f402471087ae653 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: otherReportPdf61b75923afd9e5155f402471087ae653.url(options),
    method: 'get',
})

otherReportPdf61b75923afd9e5155f402471087ae653.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/documents/other-report/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdf61b75923afd9e5155f402471087ae653.url = (options?: RouteQueryOptions) => {
    return otherReportPdf61b75923afd9e5155f402471087ae653.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdf61b75923afd9e5155f402471087ae653.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: otherReportPdf61b75923afd9e5155f402471087ae653.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdf61b75923afd9e5155f402471087ae653.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: otherReportPdf61b75923afd9e5155f402471087ae653.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
    const otherReportPdf61b75923afd9e5155f402471087ae653Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: otherReportPdf61b75923afd9e5155f402471087ae653.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
        otherReportPdf61b75923afd9e5155f402471087ae653Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: otherReportPdf61b75923afd9e5155f402471087ae653.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
        otherReportPdf61b75923afd9e5155f402471087ae653Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: otherReportPdf61b75923afd9e5155f402471087ae653.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    otherReportPdf61b75923afd9e5155f402471087ae653.form = otherReportPdf61b75923afd9e5155f402471087ae653Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
const otherReportPdfe6ba8b60becd406a2e3396369781cdf4 = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url(options),
    method: 'get',
})

otherReportPdfe6ba8b60becd406a2e3396369781cdf4.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/documents/other-report/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url = (options?: RouteQueryOptions) => {
    return otherReportPdfe6ba8b60becd406a2e3396369781cdf4.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdfe6ba8b60becd406a2e3396369781cdf4.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
otherReportPdfe6ba8b60becd406a2e3396369781cdf4.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
    const otherReportPdfe6ba8b60becd406a2e3396369781cdf4Form = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
        otherReportPdfe6ba8b60becd406a2e3396369781cdf4Form.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/whatsapp-bot/documents/other-report/pdf'
 */
        otherReportPdfe6ba8b60becd406a2e3396369781cdf4Form.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: otherReportPdfe6ba8b60becd406a2e3396369781cdf4.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    otherReportPdfe6ba8b60becd406a2e3396369781cdf4.form = otherReportPdfe6ba8b60becd406a2e3396369781cdf4Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::otherReportPdf, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `otherReportPdf['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const otherReportPdf = {
    '/api/whatsapp-bot/documents/other-report/pdf': otherReportPdf61b75923afd9e5155f402471087ae653,
    '/whatsapp-bot/documents/other-report/pdf': otherReportPdfe6ba8b60becd406a2e3396369781cdf4,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
const createVoucher396e8ebba2867710bffd8386de24897c = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVoucher396e8ebba2867710bffd8386de24897c.url(options),
    method: 'post',
})

createVoucher396e8ebba2867710bffd8386de24897c.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
createVoucher396e8ebba2867710bffd8386de24897c.url = (options?: RouteQueryOptions) => {
    return createVoucher396e8ebba2867710bffd8386de24897c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
createVoucher396e8ebba2867710bffd8386de24897c.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVoucher396e8ebba2867710bffd8386de24897c.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
    const createVoucher396e8ebba2867710bffd8386de24897cForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createVoucher396e8ebba2867710bffd8386de24897c.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
        createVoucher396e8ebba2867710bffd8386de24897cForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createVoucher396e8ebba2867710bffd8386de24897c.url(options),
            method: 'post',
        })
    
    createVoucher396e8ebba2867710bffd8386de24897c.form = createVoucher396e8ebba2867710bffd8386de24897cForm
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
const createVoucher81ea68dc169022cebeb15f5e7203ac6c = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVoucher81ea68dc169022cebeb15f5e7203ac6c.url(options),
    method: 'post',
})

createVoucher81ea68dc169022cebeb15f5e7203ac6c.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
createVoucher81ea68dc169022cebeb15f5e7203ac6c.url = (options?: RouteQueryOptions) => {
    return createVoucher81ea68dc169022cebeb15f5e7203ac6c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
createVoucher81ea68dc169022cebeb15f5e7203ac6c.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVoucher81ea68dc169022cebeb15f5e7203ac6c.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
    const createVoucher81ea68dc169022cebeb15f5e7203ac6cForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createVoucher81ea68dc169022cebeb15f5e7203ac6c.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/whatsapp-bot/documents/voucher/create'
 */
        createVoucher81ea68dc169022cebeb15f5e7203ac6cForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createVoucher81ea68dc169022cebeb15f5e7203ac6c.url(options),
            method: 'post',
        })
    
    createVoucher81ea68dc169022cebeb15f5e7203ac6c.form = createVoucher81ea68dc169022cebeb15f5e7203ac6cForm

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::createVoucher, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `createVoucher['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const createVoucher = {
    '/api/whatsapp-bot/documents/voucher/create': createVoucher396e8ebba2867710bffd8386de24897c,
    '/whatsapp-bot/documents/voucher/create': createVoucher81ea68dc169022cebeb15f5e7203ac6c,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
const accountsByType08e0c886fdec0fa19fa2ac952c0d9547 = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url(args, options),
    method: 'get',
})

accountsByType08e0c886fdec0fa19fa2ac952c0d9547.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/accounts/type/{alias}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return accountsByType08e0c886fdec0fa19fa2ac952c0d9547.definition.url
            .replace('{alias}', parsedArgs.alias.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType08e0c886fdec0fa19fa2ac952c0d9547.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType08e0c886fdec0fa19fa2ac952c0d9547.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
    const accountsByType08e0c886fdec0fa19fa2ac952c0d9547Form = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
        accountsByType08e0c886fdec0fa19fa2ac952c0d9547Form.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/api/whatsapp-bot/accounts/type/{alias}'
 */
        accountsByType08e0c886fdec0fa19fa2ac952c0d9547Form.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountsByType08e0c886fdec0fa19fa2ac952c0d9547.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    accountsByType08e0c886fdec0fa19fa2ac952c0d9547.form = accountsByType08e0c886fdec0fa19fa2ac952c0d9547Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
const accountsByType08d8b08e307da0a6e002fbd5af68042a = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsByType08d8b08e307da0a6e002fbd5af68042a.url(args, options),
    method: 'get',
})

accountsByType08d8b08e307da0a6e002fbd5af68042a.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/accounts/type/{alias}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType08d8b08e307da0a6e002fbd5af68042a.url = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return accountsByType08d8b08e307da0a6e002fbd5af68042a.definition.url
            .replace('{alias}', parsedArgs.alias.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType08d8b08e307da0a6e002fbd5af68042a.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: accountsByType08d8b08e307da0a6e002fbd5af68042a.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
accountsByType08d8b08e307da0a6e002fbd5af68042a.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: accountsByType08d8b08e307da0a6e002fbd5af68042a.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
    const accountsByType08d8b08e307da0a6e002fbd5af68042aForm = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: accountsByType08d8b08e307da0a6e002fbd5af68042a.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
        accountsByType08d8b08e307da0a6e002fbd5af68042aForm.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountsByType08d8b08e307da0a6e002fbd5af68042a.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1604
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
        accountsByType08d8b08e307da0a6e002fbd5af68042aForm.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: accountsByType08d8b08e307da0a6e002fbd5af68042a.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    accountsByType08d8b08e307da0a6e002fbd5af68042a.form = accountsByType08d8b08e307da0a6e002fbd5af68042aForm

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::accountsByType, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `accountsByType['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const accountsByType = {
    '/api/whatsapp-bot/accounts/type/{alias}': accountsByType08e0c886fdec0fa19fa2ac952c0d9547,
    '/whatsapp-bot/accounts/type/{alias}': accountsByType08d8b08e307da0a6e002fbd5af68042a,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
const createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.url(options),
    method: 'post',
})

createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/journal-voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.url = (options?: RouteQueryOptions) => {
    return createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
    const createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
        createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.url(options),
            method: 'post',
        })
    
    createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5.form = createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
const createJournalVoucher63980c0db6341395d202521209f54851 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createJournalVoucher63980c0db6341395d202521209f54851.url(options),
    method: 'post',
})

createJournalVoucher63980c0db6341395d202521209f54851.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/journal-voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
createJournalVoucher63980c0db6341395d202521209f54851.url = (options?: RouteQueryOptions) => {
    return createJournalVoucher63980c0db6341395d202521209f54851.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
createJournalVoucher63980c0db6341395d202521209f54851.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createJournalVoucher63980c0db6341395d202521209f54851.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
    const createJournalVoucher63980c0db6341395d202521209f54851Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createJournalVoucher63980c0db6341395d202521209f54851.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/whatsapp-bot/documents/journal-voucher/create'
 */
        createJournalVoucher63980c0db6341395d202521209f54851Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createJournalVoucher63980c0db6341395d202521209f54851.url(options),
            method: 'post',
        })
    
    createJournalVoucher63980c0db6341395d202521209f54851.form = createJournalVoucher63980c0db6341395d202521209f54851Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::createJournalVoucher, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `createJournalVoucher['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const createJournalVoucher = {
    '/api/whatsapp-bot/documents/journal-voucher/create': createJournalVoucherc559d0f93c1e5df1e2114ac6589c8fc5,
    '/whatsapp-bot/documents/journal-voucher/create': createJournalVoucher63980c0db6341395d202521209f54851,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/api/whatsapp-bot/documents/invoice/create'
 */
const createHotelInvoice793af72f170f4f3571f77f507e7e047c = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createHotelInvoice793af72f170f4f3571f77f507e7e047c.url(options),
    method: 'post',
})

createHotelInvoice793af72f170f4f3571f77f507e7e047c.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/api/whatsapp-bot/documents/invoice/create'
 */
createHotelInvoice793af72f170f4f3571f77f507e7e047c.url = (options?: RouteQueryOptions) => {
    return createHotelInvoice793af72f170f4f3571f77f507e7e047c.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/api/whatsapp-bot/documents/invoice/create'
 */
createHotelInvoice793af72f170f4f3571f77f507e7e047c.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createHotelInvoice793af72f170f4f3571f77f507e7e047c.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/api/whatsapp-bot/documents/invoice/create'
 */
    const createHotelInvoice793af72f170f4f3571f77f507e7e047cForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createHotelInvoice793af72f170f4f3571f77f507e7e047c.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/api/whatsapp-bot/documents/invoice/create'
 */
        createHotelInvoice793af72f170f4f3571f77f507e7e047cForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createHotelInvoice793af72f170f4f3571f77f507e7e047c.url(options),
            method: 'post',
        })
    
    createHotelInvoice793af72f170f4f3571f77f507e7e047c.form = createHotelInvoice793af72f170f4f3571f77f507e7e047cForm
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/whatsapp-bot/documents/invoice/create'
 */
const createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.url(options),
    method: 'post',
})

createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/whatsapp-bot/documents/invoice/create'
 */
createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.url = (options?: RouteQueryOptions) => {
    return createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/whatsapp-bot/documents/invoice/create'
 */
createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/whatsapp-bot/documents/invoice/create'
 */
    const createHotelInvoicef4d48b4988d5c7a6d680708a13dc521dForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1703
 * @route '/whatsapp-bot/documents/invoice/create'
 */
        createHotelInvoicef4d48b4988d5c7a6d680708a13dc521dForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.url(options),
            method: 'post',
        })
    
    createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d.form = createHotelInvoicef4d48b4988d5c7a6d680708a13dc521dForm

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::createHotelInvoice, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `createHotelInvoice['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const createHotelInvoice = {
    '/api/whatsapp-bot/documents/invoice/create': createHotelInvoice793af72f170f4f3571f77f507e7e047c,
    '/whatsapp-bot/documents/invoice/create': createHotelInvoicef4d48b4988d5c7a6d680708a13dc521d,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
const addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33 = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.url(args, options),
    method: 'post',
})

addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
    const addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33Form = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
        addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33Form.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.url(args, options),
            method: 'post',
        })
    
    addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33.form = addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
const addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.url(args, options),
    method: 'post',
})

addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/hotel/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
    const addHotelInvoiceLine308d9e8b176ca9728790306b460f62acForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
        addHotelInvoiceLine308d9e8b176ca9728790306b460f62acForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.url(args, options),
            method: 'post',
        })
    
    addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac.form = addHotelInvoiceLine308d9e8b176ca9728790306b460f62acForm

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::addHotelInvoiceLine, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `addHotelInvoiceLine['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const addHotelInvoiceLine = {
    '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add': addHotelInvoiceLine609b816df897a1c2a85e49a44b8e5e33,
    '/whatsapp-bot/documents/invoice/{reference}/hotel/add': addHotelInvoiceLine308d9e8b176ca9728790306b460f62ac,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/api/whatsapp-bot/documents/invoice/visa/create'
 */
const createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.url(options),
    method: 'post',
})

createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/visa/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/api/whatsapp-bot/documents/invoice/visa/create'
 */
createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.url = (options?: RouteQueryOptions) => {
    return createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/api/whatsapp-bot/documents/invoice/visa/create'
 */
createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/api/whatsapp-bot/documents/invoice/visa/create'
 */
    const createVisaInvoicef28cc3e3d843adf82ca8f1919a77693dForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/api/whatsapp-bot/documents/invoice/visa/create'
 */
        createVisaInvoicef28cc3e3d843adf82ca8f1919a77693dForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.url(options),
            method: 'post',
        })
    
    createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d.form = createVisaInvoicef28cc3e3d843adf82ca8f1919a77693dForm
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
const createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.url(options),
    method: 'post',
})

createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/visa/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.url = (options?: RouteQueryOptions) => {
    return createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
    const createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1825
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
        createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.url(options),
            method: 'post',
        })
    
    createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16.form = createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::createVisaInvoice, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `createVisaInvoice['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const createVisaInvoice = {
    '/api/whatsapp-bot/documents/invoice/visa/create': createVisaInvoicef28cc3e3d843adf82ca8f1919a77693d,
    '/whatsapp-bot/documents/invoice/visa/create': createVisaInvoicee402d932bf9b7e92401b1b1ad6905c16,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
const addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.url(args, options),
    method: 'post',
})

addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/{reference}/visa/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
    const addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168eForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
        addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168eForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.url(args, options),
            method: 'post',
        })
    
    addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e.form = addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168eForm
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
const addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72 = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.url(args, options),
    method: 'post',
})

addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/visa/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
    const addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72Form = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1874
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
        addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72Form.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.url(args, options),
            method: 'post',
        })
    
    addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72.form = addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::addVisaInvoiceLine, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `addVisaInvoiceLine['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const addVisaInvoiceLine = {
    '/api/whatsapp-bot/documents/invoice/{reference}/visa/add': addVisaInvoiceLine8c5f2203d911d341388b7d4dc8e4168e,
    '/whatsapp-bot/documents/invoice/{reference}/visa/add': addVisaInvoiceLineca6e6cf3f545f1f3b7c2e63a77b3ec72,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
const createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.url(options),
    method: 'post',
})

createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/transfer/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.url = (options?: RouteQueryOptions) => {
    return createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
    const createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
        createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.url(options),
            method: 'post',
        })
    
    createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209.form = createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209Form
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
const createTransferInvoice2c5247bb3c636b659c13736e54d273f5 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTransferInvoice2c5247bb3c636b659c13736e54d273f5.url(options),
    method: 'post',
})

createTransferInvoice2c5247bb3c636b659c13736e54d273f5.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/transfer/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
createTransferInvoice2c5247bb3c636b659c13736e54d273f5.url = (options?: RouteQueryOptions) => {
    return createTransferInvoice2c5247bb3c636b659c13736e54d273f5.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
createTransferInvoice2c5247bb3c636b659c13736e54d273f5.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createTransferInvoice2c5247bb3c636b659c13736e54d273f5.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
    const createTransferInvoice2c5247bb3c636b659c13736e54d273f5Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: createTransferInvoice2c5247bb3c636b659c13736e54d273f5.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/whatsapp-bot/documents/invoice/transfer/create'
 */
        createTransferInvoice2c5247bb3c636b659c13736e54d273f5Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: createTransferInvoice2c5247bb3c636b659c13736e54d273f5.url(options),
            method: 'post',
        })
    
    createTransferInvoice2c5247bb3c636b659c13736e54d273f5.form = createTransferInvoice2c5247bb3c636b659c13736e54d273f5Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::createTransferInvoice, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `createTransferInvoice['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const createTransferInvoice = {
    '/api/whatsapp-bot/documents/invoice/transfer/create': createTransferInvoice3a0680d5c0a7a7e9dee1e7f0baf2d209,
    '/whatsapp-bot/documents/invoice/transfer/create': createTransferInvoice2c5247bb3c636b659c13736e54d273f5,
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
const addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.url(args, options),
    method: 'post',
})

addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
    const addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fdForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
        addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fdForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.url(args, options),
            method: 'post',
        })
    
    addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd.form = addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fdForm
    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
const addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713 = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.url(args, options),
    method: 'post',
})

addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/transfer/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
    const addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713Form = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
        addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713Form.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.url(args, options),
            method: 'post',
        })
    
    addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713.form = addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713Form

/**
* Multiple routes resolve to \App\Http\Controllers\WhatsAppBotDocumentController::addTransferInvoiceLine, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `addTransferInvoiceLine['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const addTransferInvoiceLine = {
    '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add': addTransferInvoiceLine19d32c2ada94d2287938cd11c1e9d4fd,
    '/whatsapp-bot/documents/invoice/{reference}/transfer/add': addTransferInvoiceLinee285ad4eaf22fc6cef3d32f1a385f713,
}

const WhatsAppBotDocumentController = { invoicePdf, voucherPdf, ledgerPdf, otherReportPdf, createVoucher, accountsByType, createJournalVoucher, createHotelInvoice, addHotelInvoiceLine, createVisaInvoice, addVisaInvoiceLine, createTransferInvoice, addTransferInvoiceLine }

export default WhatsAppBotDocumentController