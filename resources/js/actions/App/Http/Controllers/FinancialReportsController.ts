import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reports/financial',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialReportsController::index
 * @see app/Http/Controllers/FinancialReportsController.php:40
 * @route '/reports/financial'
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
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
 */
export const print = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/reports/financial/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
 */
print.url = (options?: RouteQueryOptions) => {
    return print.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
 */
print.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
 */
print.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
 */
    const printForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
 */
        printForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialReportsController::print
 * @see app/Http/Controllers/FinancialReportsController.php:62
 * @route '/reports/financial/print'
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
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/reports/financial/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialReportsController::pdf
 * @see app/Http/Controllers/FinancialReportsController.php:77
 * @route '/reports/financial/pdf'
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
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
 */
export const excel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})

excel.definition = {
    methods: ["get","head"],
    url: '/reports/financial/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
 */
excel.url = (options?: RouteQueryOptions) => {
    return excel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
 */
excel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
 */
excel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: excel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
 */
    const excelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: excel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
 */
        excelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialReportsController::excel
 * @see app/Http/Controllers/FinancialReportsController.php:100
 * @route '/reports/financial/excel'
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
const FinancialReportsController = { index, print, pdf, excel }

export default FinancialReportsController