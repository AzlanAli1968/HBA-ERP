import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
export const todayPayments = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: todayPayments.url(options),
    method: 'get',
})

todayPayments.definition = {
    methods: ["get","head"],
    url: '/accounting/payments/today',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
todayPayments.url = (options?: RouteQueryOptions) => {
    return todayPayments.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
todayPayments.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: todayPayments.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
todayPayments.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: todayPayments.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
    const todayPaymentsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: todayPayments.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
        todayPaymentsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: todayPayments.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::todayPayments
 * @see app/Http/Controllers/VoucherController.php:2170
 * @route '/accounting/payments/today'
 */
        todayPaymentsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: todayPayments.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    todayPayments.form = todayPaymentsForm
/**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
export const allPayments = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: allPayments.url(options),
    method: 'get',
})

allPayments.definition = {
    methods: ["get","head"],
    url: '/accounting/payments/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
allPayments.url = (options?: RouteQueryOptions) => {
    return allPayments.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
allPayments.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: allPayments.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
allPayments.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: allPayments.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
    const allPaymentsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: allPayments.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
        allPaymentsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: allPayments.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::allPayments
 * @see app/Http/Controllers/VoucherController.php:2184
 * @route '/accounting/payments/all'
 */
        allPaymentsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: allPayments.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    allPayments.form = allPaymentsForm
/**
* @see \App\Http\Controllers\VoucherController::destroy
 * @see app/Http/Controllers/VoucherController.php:299
 * @route '/accounting/vouchers/{voucher}'
 */
export const destroy = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/accounting/vouchers/{voucher}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\VoucherController::destroy
 * @see app/Http/Controllers/VoucherController.php:299
 * @route '/accounting/vouchers/{voucher}'
 */
destroy.url = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { voucher: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    voucher: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        voucher: args.voucher,
                }

    return destroy.definition.url
            .replace('{voucher}', parsedArgs.voucher.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::destroy
 * @see app/Http/Controllers/VoucherController.php:299
 * @route '/accounting/vouchers/{voucher}'
 */
destroy.delete = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\VoucherController::destroy
 * @see app/Http/Controllers/VoucherController.php:299
 * @route '/accounting/vouchers/{voucher}'
 */
    const destroyForm = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VoucherController::destroy
 * @see app/Http/Controllers/VoucherController.php:299
 * @route '/accounting/vouchers/{voucher}'
 */
        destroyForm.delete = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/accounting/vouchers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::index
 * @see app/Http/Controllers/VoucherController.php:15
 * @route '/accounting/vouchers'
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
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/accounting/vouchers/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::create
 * @see app/Http/Controllers/VoucherController.php:141
 * @route '/accounting/vouchers/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\VoucherController::store
 * @see app/Http/Controllers/VoucherController.php:160
 * @route '/accounting/vouchers'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/accounting/vouchers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VoucherController::store
 * @see app/Http/Controllers/VoucherController.php:160
 * @route '/accounting/vouchers'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::store
 * @see app/Http/Controllers/VoucherController.php:160
 * @route '/accounting/vouchers'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VoucherController::store
 * @see app/Http/Controllers/VoucherController.php:160
 * @route '/accounting/vouchers'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VoucherController::store
 * @see app/Http/Controllers/VoucherController.php:160
 * @route '/accounting/vouchers'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
export const edit = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/accounting/vouchers/{voucher}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
edit.url = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { voucher: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    voucher: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        voucher: args.voucher,
                }

    return edit.definition.url
            .replace('{voucher}', parsedArgs.voucher.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
edit.get = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
edit.head = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
    const editForm = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
        editForm.get = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::edit
 * @see app/Http/Controllers/VoucherController.php:232
 * @route '/accounting/vouchers/{voucher}/edit'
 */
        editForm.head = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\VoucherController::update
 * @see app/Http/Controllers/VoucherController.php:255
 * @route '/accounting/vouchers/{voucher}'
 */
export const update = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/accounting/vouchers/{voucher}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\VoucherController::update
 * @see app/Http/Controllers/VoucherController.php:255
 * @route '/accounting/vouchers/{voucher}'
 */
update.url = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { voucher: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    voucher: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        voucher: args.voucher,
                }

    return update.definition.url
            .replace('{voucher}', parsedArgs.voucher.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::update
 * @see app/Http/Controllers/VoucherController.php:255
 * @route '/accounting/vouchers/{voucher}'
 */
update.put = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\VoucherController::update
 * @see app/Http/Controllers/VoucherController.php:255
 * @route '/accounting/vouchers/{voucher}'
 */
    const updateForm = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VoucherController::update
 * @see app/Http/Controllers/VoucherController.php:255
 * @route '/accounting/vouchers/{voucher}'
 */
        updateForm.put = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
export const invoices = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(options),
    method: 'get',
})

invoices.definition = {
    methods: ["get","head"],
    url: '/accounting/vouchers/invoices',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
invoices.url = (options?: RouteQueryOptions) => {
    return invoices.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
invoices.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
invoices.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoices.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
    const invoicesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoices.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
        invoicesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoices.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VoucherController::invoices
 * @see app/Http/Controllers/VoucherController.php:213
 * @route '/accounting/vouchers/invoices'
 */
        invoicesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoices.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    invoices.form = invoicesForm
const VoucherController = { todayPayments, allPayments, destroy, index, create, store, edit, update, invoices }

export default VoucherController