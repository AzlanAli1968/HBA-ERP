import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/accounting/ledger',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LedgerController::index
 * @see app/Http/Controllers/LedgerController.php:23
 * @route '/accounting/ledger'
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
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
export const print = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/accounting/ledger/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
print.url = (options?: RouteQueryOptions) => {
    return print.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
print.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
print.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
    const printForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
        printForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LedgerController::print
 * @see app/Http/Controllers/LedgerController.php:45
 * @route '/accounting/ledger/print'
 */
        printForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    print.form = printForm
/**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/accounting/ledger/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LedgerController::pdf
 * @see app/Http/Controllers/LedgerController.php:70
 * @route '/accounting/ledger/pdf'
 */
        pdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pdf.form = pdfForm
/**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
export const excel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})

excel.definition = {
    methods: ["get","head"],
    url: '/accounting/ledger/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
excel.url = (options?: RouteQueryOptions) => {
    return excel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
excel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
excel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: excel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
    const excelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: excel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
        excelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LedgerController::excel
 * @see app/Http/Controllers/LedgerController.php:127
 * @route '/accounting/ledger/excel'
 */
        excelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    excel.form = excelForm
const LedgerController = { index, print, pdf, excel }

export default LedgerController