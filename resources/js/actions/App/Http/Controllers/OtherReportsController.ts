import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reports/other',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OtherReportsController::index
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
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
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
 */
export const print = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/reports/other/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
 */
print.url = (options?: RouteQueryOptions) => {
    return print.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
 */
print.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
 */
print.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
 */
    const printForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
 */
        printForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OtherReportsController::print
 * @see app/Http/Controllers/OtherReportsController.php:39
 * @route '/reports/other/print'
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
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/reports/other/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OtherReportsController::pdf
 * @see app/Http/Controllers/OtherReportsController.php:50
 * @route '/reports/other/pdf'
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
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
 */
export const excel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})

excel.definition = {
    methods: ["get","head"],
    url: '/reports/other/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
 */
excel.url = (options?: RouteQueryOptions) => {
    return excel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
 */
excel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
 */
excel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: excel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
 */
    const excelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: excel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
 */
        excelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OtherReportsController::excel
 * @see app/Http/Controllers/OtherReportsController.php:64
 * @route '/reports/other/excel'
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
const OtherReportsController = { index, print, pdf, excel }

export default OtherReportsController