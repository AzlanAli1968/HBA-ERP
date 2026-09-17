import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/accounting/cash-bank-balances',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CashBankBalanceController::index
 * @see app/Http/Controllers/CashBankBalanceController.php:19
 * @route '/accounting/cash-bank-balances'
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
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
export const foreignCurrencies = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: foreignCurrencies.url(options),
    method: 'get',
})

foreignCurrencies.definition = {
    methods: ["get","head"],
    url: '/accounting/cash-bank-balances/foreign-currencies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
foreignCurrencies.url = (options?: RouteQueryOptions) => {
    return foreignCurrencies.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
foreignCurrencies.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: foreignCurrencies.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
foreignCurrencies.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: foreignCurrencies.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
    const foreignCurrenciesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: foreignCurrencies.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
        foreignCurrenciesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: foreignCurrencies.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CashBankBalanceController::foreignCurrencies
 * @see app/Http/Controllers/CashBankBalanceController.php:112
 * @route '/accounting/cash-bank-balances/foreign-currencies'
 */
        foreignCurrenciesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: foreignCurrencies.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    foreignCurrencies.form = foreignCurrenciesForm
const CashBankBalanceController = { index, foreignCurrencies }

export default CashBankBalanceController