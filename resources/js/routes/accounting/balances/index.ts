import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
export const customers = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customers.url(options),
    method: 'get',
})

customers.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
customers.url = (options?: RouteQueryOptions) => {
    return customers.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
customers.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customers.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
customers.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customers.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
    const customersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: customers.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
        customersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customers.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalancesController::customers
 * @see app/Http/Controllers/AccountBalancesController.php:13
 * @route '/accounting/balances/customers'
 */
        customersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customers.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    customers.form = customersForm
/**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
export const payables = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payables.url(options),
    method: 'get',
})

payables.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/payables',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
payables.url = (options?: RouteQueryOptions) => {
    return payables.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
payables.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payables.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
payables.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: payables.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
    const payablesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: payables.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
        payablesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: payables.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalancesController::payables
 * @see app/Http/Controllers/AccountBalancesController.php:18
 * @route '/accounting/balances/payables'
 */
        payablesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: payables.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    payables.form = payablesForm
const balances = {
    customers: Object.assign(customers, customers),
payables: Object.assign(payables, payables),
}

export default balances