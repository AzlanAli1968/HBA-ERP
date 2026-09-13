import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
export const today = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: today.url(options),
    method: 'get',
})

today.definition = {
    methods: ["get","head"],
    url: '/accounting/receipts/today',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
today.url = (options?: RouteQueryOptions) => {
    return today.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
today.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: today.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
today.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: today.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
    const todayForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: today.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
        todayForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: today.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReceiptReportsController::today
 * @see app/Http/Controllers/ReceiptReportsController.php:12
 * @route '/accounting/receipts/today'
 */
        todayForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: today.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    today.form = todayForm
/**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
export const all = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})

all.definition = {
    methods: ["get","head"],
    url: '/accounting/receipts/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
all.url = (options?: RouteQueryOptions) => {
    return all.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
all.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
all.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: all.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
    const allForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: all.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
        allForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: all.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReceiptReportsController::all
 * @see app/Http/Controllers/ReceiptReportsController.php:20
 * @route '/accounting/receipts/all'
 */
        allForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: all.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    all.form = allForm
const ReceiptReportsController = { today, all }

export default ReceiptReportsController