import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/invoices',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/invoices/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1096
 * @route '/invoices/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2310
 * @route '/invoices'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/invoices',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2310
 * @route '/invoices'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2310
 * @route '/invoices'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2310
 * @route '/invoices'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2310
 * @route '/invoices'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
export const lines = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lines.url(args, options),
    method: 'get',
})

lines.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/lines',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
lines.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return lines.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
lines.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lines.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
lines.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: lines.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
    const linesForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: lines.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
        linesForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: lines.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:262
 * @route '/invoices/{invoice}/lines'
 */
        linesForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: lines.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    lines.form = linesForm
/**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
export const invoicePrint = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePrint.url(args, options),
    method: 'get',
})

invoicePrint.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
invoicePrint.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return invoicePrint.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
invoicePrint.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePrint.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
invoicePrint.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoicePrint.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
    const invoicePrintForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoicePrint.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
        invoicePrintForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePrint.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::invoicePrint
 * @see app/Http/Controllers/InvoiceController.php:417
 * @route '/invoices/{invoice}/print'
 */
        invoicePrintForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePrint.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    invoicePrint.form = invoicePrintForm
/**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
export const invoicePdf = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf.url(args, options),
    method: 'get',
})

invoicePdf.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
invoicePdf.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return invoicePdf.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
invoicePdf.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoicePdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
invoicePdf.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoicePdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
    const invoicePdfForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoicePdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
        invoicePdfForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoicePdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::invoicePdf
 * @see app/Http/Controllers/InvoiceController.php:432
 * @route '/invoices/{invoice}/pdf'
 */
        invoicePdfForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
export const voucherPrint = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPrint.url(args, options),
    method: 'get',
})

voucherPrint.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/voucher/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
voucherPrint.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return voucherPrint.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
voucherPrint.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPrint.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
voucherPrint.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: voucherPrint.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
    const voucherPrintForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: voucherPrint.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
        voucherPrintForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPrint.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::voucherPrint
 * @see app/Http/Controllers/InvoiceController.php:452
 * @route '/invoices/{invoice}/voucher/print'
 */
        voucherPrintForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPrint.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    voucherPrint.form = voucherPrintForm
/**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
export const voucherPdf = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdf.url(args, options),
    method: 'get',
})

voucherPdf.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/voucher/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
voucherPdf.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return voucherPdf.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
voucherPdf.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: voucherPdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
voucherPdf.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: voucherPdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
    const voucherPdfForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: voucherPdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
        voucherPdfForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: voucherPdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::voucherPdf
 * @see app/Http/Controllers/InvoiceController.php:467
 * @route '/invoices/{invoice}/voucher/pdf'
 */
        voucherPdfForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
export const edit = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
edit.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return edit.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
edit.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
edit.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
    const editForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
        editForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1317
 * @route '/invoices/{invoice}/edit'
 */
        editForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
export const show = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
show.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return show.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
show.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
show.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
    const showForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
        showForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1108
 * @route '/invoices/{invoice}'
 */
        showForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7390
 * @route '/invoices/{invoice}'
 */
export const update = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/invoices/{invoice}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7390
 * @route '/invoices/{invoice}'
 */
update.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return update.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7390
 * @route '/invoices/{invoice}'
 */
update.put = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7390
 * @route '/invoices/{invoice}'
 */
    const updateForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7390
 * @route '/invoices/{invoice}'
 */
        updateForm.put = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7482
 * @route '/invoices/{invoice}'
 */
export const destroy = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/invoices/{invoice}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7482
 * @route '/invoices/{invoice}'
 */
destroy.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return destroy.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7482
 * @route '/invoices/{invoice}'
 */
destroy.delete = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7482
 * @route '/invoices/{invoice}'
 */
    const destroyForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7482
 * @route '/invoices/{invoice}'
 */
        destroyForm.delete = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\InvoiceController::storeHotel
 * @see app/Http/Controllers/InvoiceController.php:818
 * @route '/invoices/options/hotels'
 */
export const storeHotel = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeHotel.url(options),
    method: 'post',
})

storeHotel.definition = {
    methods: ["post"],
    url: '/invoices/options/hotels',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::storeHotel
 * @see app/Http/Controllers/InvoiceController.php:818
 * @route '/invoices/options/hotels'
 */
storeHotel.url = (options?: RouteQueryOptions) => {
    return storeHotel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::storeHotel
 * @see app/Http/Controllers/InvoiceController.php:818
 * @route '/invoices/options/hotels'
 */
storeHotel.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeHotel.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::storeHotel
 * @see app/Http/Controllers/InvoiceController.php:818
 * @route '/invoices/options/hotels'
 */
    const storeHotelForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeHotel.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::storeHotel
 * @see app/Http/Controllers/InvoiceController.php:818
 * @route '/invoices/options/hotels'
 */
        storeHotelForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeHotel.url(options),
            method: 'post',
        })
    
    storeHotel.form = storeHotelForm
/**
* @see \App\Http\Controllers\InvoiceController::storeVisaType
 * @see app/Http/Controllers/InvoiceController.php:758
 * @route '/invoices/options/visa-types'
 */
export const storeVisaType = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeVisaType.url(options),
    method: 'post',
})

storeVisaType.definition = {
    methods: ["post"],
    url: '/invoices/options/visa-types',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::storeVisaType
 * @see app/Http/Controllers/InvoiceController.php:758
 * @route '/invoices/options/visa-types'
 */
storeVisaType.url = (options?: RouteQueryOptions) => {
    return storeVisaType.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::storeVisaType
 * @see app/Http/Controllers/InvoiceController.php:758
 * @route '/invoices/options/visa-types'
 */
storeVisaType.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeVisaType.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::storeVisaType
 * @see app/Http/Controllers/InvoiceController.php:758
 * @route '/invoices/options/visa-types'
 */
    const storeVisaTypeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeVisaType.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::storeVisaType
 * @see app/Http/Controllers/InvoiceController.php:758
 * @route '/invoices/options/visa-types'
 */
        storeVisaTypeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeVisaType.url(options),
            method: 'post',
        })
    
    storeVisaType.form = storeVisaTypeForm
/**
* @see \App\Http\Controllers\InvoiceController::storeVehicle
 * @see app/Http/Controllers/InvoiceController.php:838
 * @route '/invoices/options/vehicles'
 */
export const storeVehicle = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeVehicle.url(options),
    method: 'post',
})

storeVehicle.definition = {
    methods: ["post"],
    url: '/invoices/options/vehicles',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::storeVehicle
 * @see app/Http/Controllers/InvoiceController.php:838
 * @route '/invoices/options/vehicles'
 */
storeVehicle.url = (options?: RouteQueryOptions) => {
    return storeVehicle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::storeVehicle
 * @see app/Http/Controllers/InvoiceController.php:838
 * @route '/invoices/options/vehicles'
 */
storeVehicle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeVehicle.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::storeVehicle
 * @see app/Http/Controllers/InvoiceController.php:838
 * @route '/invoices/options/vehicles'
 */
    const storeVehicleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeVehicle.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::storeVehicle
 * @see app/Http/Controllers/InvoiceController.php:838
 * @route '/invoices/options/vehicles'
 */
        storeVehicleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeVehicle.url(options),
            method: 'post',
        })
    
    storeVehicle.form = storeVehicleForm
/**
* @see \App\Http\Controllers\InvoiceController::storeTransferLocation
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
export const storeTransferLocation = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeTransferLocation.url(options),
    method: 'post',
})

storeTransferLocation.definition = {
    methods: ["post"],
    url: '/invoices/options/transfer-locations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::storeTransferLocation
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
storeTransferLocation.url = (options?: RouteQueryOptions) => {
    return storeTransferLocation.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::storeTransferLocation
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
storeTransferLocation.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeTransferLocation.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::storeTransferLocation
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
    const storeTransferLocationForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeTransferLocation.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::storeTransferLocation
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
        storeTransferLocationForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeTransferLocation.url(options),
            method: 'post',
        })
    
    storeTransferLocation.form = storeTransferLocationForm
const InvoiceController = { index, create, store, lines, invoicePrint, invoicePdf, voucherPrint, voucherPdf, edit, show, update, destroy, storeHotel, storeVisaType, storeVehicle, storeTransferLocation }

export default InvoiceController