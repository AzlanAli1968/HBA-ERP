import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
export const customersDatewise = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customersDatewise.url(options),
    method: 'get',
})

customersDatewise.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers/datewise',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
customersDatewise.url = (options?: RouteQueryOptions) => {
    return customersDatewise.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
customersDatewise.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customersDatewise.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
customersDatewise.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customersDatewise.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
    const customersDatewiseForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: customersDatewise.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
        customersDatewiseForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customersDatewise.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersDatewise
 * @see app/Http/Controllers/AccountBalanceReportsController.php:13
 * @route '/accounting/balances/customers/datewise'
 */
        customersDatewiseForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customersDatewise.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    customersDatewise.form = customersDatewiseForm
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
export const customersWithPhone = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customersWithPhone.url(options),
    method: 'get',
})

customersWithPhone.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers/phone',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
customersWithPhone.url = (options?: RouteQueryOptions) => {
    return customersWithPhone.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
customersWithPhone.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customersWithPhone.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
customersWithPhone.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customersWithPhone.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
    const customersWithPhoneForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: customersWithPhone.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
        customersWithPhoneForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customersWithPhone.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersWithPhone
 * @see app/Http/Controllers/AccountBalanceReportsController.php:42
 * @route '/accounting/balances/customers/phone'
 */
        customersWithPhoneForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customersWithPhone.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    customersWithPhone.form = customersWithPhoneForm
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
export const customersForeign = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customersForeign.url(options),
    method: 'get',
})

customersForeign.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/customers/foreign',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
customersForeign.url = (options?: RouteQueryOptions) => {
    return customersForeign.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
customersForeign.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customersForeign.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
customersForeign.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customersForeign.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
    const customersForeignForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: customersForeign.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
        customersForeignForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customersForeign.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::customersForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:271
 * @route '/accounting/balances/customers/foreign'
 */
        customersForeignForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customersForeign.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    customersForeign.form = customersForeignForm
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
export const payablesForeign = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payablesForeign.url(options),
    method: 'get',
})

payablesForeign.definition = {
    methods: ["get","head"],
    url: '/accounting/balances/payables/foreign',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
payablesForeign.url = (options?: RouteQueryOptions) => {
    return payablesForeign.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
payablesForeign.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payablesForeign.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
payablesForeign.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: payablesForeign.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
    const payablesForeignForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: payablesForeign.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
        payablesForeignForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: payablesForeign.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountBalanceReportsController::payablesForeign
 * @see app/Http/Controllers/AccountBalanceReportsController.php:292
 * @route '/accounting/balances/payables/foreign'
 */
        payablesForeignForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: payablesForeign.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    payablesForeign.form = payablesForeignForm
const AccountBalanceReportsController = { customersDatewise, customersWithPhone, customersForeign, payablesForeign }

export default AccountBalanceReportsController