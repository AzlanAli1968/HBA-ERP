import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
export const clientwise = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwise.url(options),
    method: 'get',
})

clientwise.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/clientwise',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
clientwise.url = (options?: RouteQueryOptions) => {
    return clientwise.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
clientwise.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwise.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
clientwise.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientwise.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
    const clientwiseForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientwise.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
        clientwiseForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwise.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
        clientwiseForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwise.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientwise.form = clientwiseForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
export const clientwisePrint = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwisePrint.url(options),
    method: 'get',
})

clientwisePrint.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/clientwise/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
clientwisePrint.url = (options?: RouteQueryOptions) => {
    return clientwisePrint.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
clientwisePrint.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwisePrint.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
clientwisePrint.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientwisePrint.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
    const clientwisePrintForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientwisePrint.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
        clientwisePrintForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwisePrint.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:44
 * @route '/accounting/clearance/clientwise/print'
 */
        clientwisePrintForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwisePrint.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientwisePrint.form = clientwisePrintForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
export const clientwisePdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwisePdf.url(options),
    method: 'get',
})

clientwisePdf.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/clientwise/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
clientwisePdf.url = (options?: RouteQueryOptions) => {
    return clientwisePdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
clientwisePdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwisePdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
clientwisePdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientwisePdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
    const clientwisePdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientwisePdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
        clientwisePdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwisePdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwisePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:57
 * @route '/accounting/clearance/clientwise/pdf'
 */
        clientwisePdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwisePdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientwisePdf.form = clientwisePdfForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
export const clientwiseExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwiseExcel.url(options),
    method: 'get',
})

clientwiseExcel.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/clientwise/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
clientwiseExcel.url = (options?: RouteQueryOptions) => {
    return clientwiseExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
clientwiseExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwiseExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
clientwiseExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientwiseExcel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
    const clientwiseExcelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientwiseExcel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
        clientwiseExcelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwiseExcel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwiseExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:74
 * @route '/accounting/clearance/clientwise/excel'
 */
        clientwiseExcelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwiseExcel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientwiseExcel.form = clientwiseExcelForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
export const difference = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: difference.url(options),
    method: 'get',
})

difference.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
difference.url = (options?: RouteQueryOptions) => {
    return difference.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
difference.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: difference.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
difference.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: difference.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
    const differenceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: difference.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
        differenceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: difference.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
        differenceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: difference.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    difference.form = differenceForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
export const differencePrint = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: differencePrint.url(options),
    method: 'get',
})

differencePrint.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
differencePrint.url = (options?: RouteQueryOptions) => {
    return differencePrint.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
differencePrint.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: differencePrint.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
differencePrint.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: differencePrint.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
    const differencePrintForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: differencePrint.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
        differencePrintForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: differencePrint.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::differencePrint
 * @see app/Http/Controllers/ClearanceReportsController.php:190
 * @route '/accounting/clearance/difference/print'
 */
        differencePrintForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: differencePrint.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    differencePrint.form = differencePrintForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
export const differencePdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: differencePdf.url(options),
    method: 'get',
})

differencePdf.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
differencePdf.url = (options?: RouteQueryOptions) => {
    return differencePdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
differencePdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: differencePdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
differencePdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: differencePdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
    const differencePdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: differencePdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
        differencePdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: differencePdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::differencePdf
 * @see app/Http/Controllers/ClearanceReportsController.php:203
 * @route '/accounting/clearance/difference/pdf'
 */
        differencePdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: differencePdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    differencePdf.form = differencePdfForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
export const differenceExcel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: differenceExcel.url(options),
    method: 'get',
})

differenceExcel.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference/excel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
differenceExcel.url = (options?: RouteQueryOptions) => {
    return differenceExcel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
differenceExcel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: differenceExcel.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
differenceExcel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: differenceExcel.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
    const differenceExcelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: differenceExcel.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
        differenceExcelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: differenceExcel.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::differenceExcel
 * @see app/Http/Controllers/ClearanceReportsController.php:220
 * @route '/accounting/clearance/difference/excel'
 */
        differenceExcelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: differenceExcel.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    differenceExcel.form = differenceExcelForm
const ClearanceReportsController = { clientwise, clientwisePrint, clientwisePdf, clientwiseExcel, difference, differencePrint, differencePdf, differenceExcel }

export default ClearanceReportsController