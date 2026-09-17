import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
export const foreign = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: foreign.url(options),
    method: 'get',
})

foreign.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/payables/foreign',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
foreign.url = (options?: RouteQueryOptions) => {
    return foreign.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
foreign.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: foreign.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
foreign.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: foreign.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
    const foreignForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: foreign.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
        foreignForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: foreign.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::foreign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
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