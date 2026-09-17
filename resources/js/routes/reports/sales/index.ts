import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
 */
export const print = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/reports/sales/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
 */
print.url = (options?: RouteQueryOptions) => {
    return print.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
 */
print.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
 */
print.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
 */
    const printForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
 */
        printForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesReportsController::print
 * @see app/Http/Controllers/SalesReportsController.php:39
 * @route '/reports/sales/print'
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
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/reports/sales/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesReportsController::pdf
 * @see app/Http/Controllers/SalesReportsController.php:56
 * @route '/reports/sales/pdf'
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
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
 */
export const excel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})

excel.definition = {
    methods: ["get","head"],
    url: '/reports/sales/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
 */
excel.url = (options?: RouteQueryOptions) => {
    return excel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
 */
excel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
 */
excel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: excel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
 */
    const excelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: excel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
 */
        excelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesReportsController::excel
 * @see app/Http/Controllers/SalesReportsController.php:73
 * @route '/reports/sales/excel'
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
const sales = {
    print: Object.assign(print, print),
pdf: Object.assign(pdf, pdf),
excel: Object.assign(excel, excel),
}

export default sales