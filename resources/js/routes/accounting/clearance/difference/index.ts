import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
export const print = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
print.url = (options?: RouteQueryOptions) => {
    return print.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
print.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
print.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
    const printForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
        printForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::print
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
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
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::pdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
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
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
export const excel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})

excel.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
excel.url = (options?: RouteQueryOptions) => {
    return excel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
excel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: excel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
excel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: excel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
    const excelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: excel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
        excelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: excel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::excel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
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
const difference = {
    print: Object.assign(print, print),
pdf: Object.assign(pdf, pdf),
excel: Object.assign(excel, excel),
}

export default difference