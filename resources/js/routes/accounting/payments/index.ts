import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
export const today = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: today.url(options),
    method: 'get',
})

today.definition = {
    methods: ["get","head"],
    url: '/accounting/payments/today',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
today.url = (options?: RouteQueryOptions) => {
    return today.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
today.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: today.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
today.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: today.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
    const todayForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: today.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
        todayForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: today.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::today
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
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
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
export const all = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})

all.definition = {
    methods: ["get","head"],
    url: '/accounting/payments/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
all.url = (options?: RouteQueryOptions) => {
    return all.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
all.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
all.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: all.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
    const allForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: all.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
        allForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: all.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::all
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
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
const payments = {
    today: Object.assign(today, today),
all: Object.assign(all, all),
}

export default payments