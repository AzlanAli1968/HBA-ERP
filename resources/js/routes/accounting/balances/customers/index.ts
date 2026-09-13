import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
export const datewise = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: datewise.url(options),
    method: 'get',
})

datewise.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers/datewise',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
datewise.url = (options?: RouteQueryOptions) => {
    return datewise.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
datewise.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: datewise.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
datewise.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: datewise.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
    const datewiseForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: datewise.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
        datewiseForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: datewise.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::datewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
        datewiseForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: datewise.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    datewise.form = datewiseForm
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
export const phone = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: phone.url(options),
    method: 'get',
})

phone.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers/phone',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
phone.url = (options?: RouteQueryOptions) => {
    return phone.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
phone.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: phone.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
phone.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: phone.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
    const phoneForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: phone.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
        phoneForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: phone.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::phone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
        phoneForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: phone.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    phone.form = phoneForm
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
export const foreign = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: foreign.url(options),
    method: 'get',
})

foreign.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers/foreign',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
foreign.url = (options?: RouteQueryOptions) => {
    return foreign.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
foreign.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: foreign.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
foreign.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: foreign.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
    const foreignForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: foreign.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
        foreignForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: foreign.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
        foreignForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: foreign.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    foreign.form = foreignForm