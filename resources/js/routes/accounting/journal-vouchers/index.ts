import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
 */
export const today = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: today.url(options),
    method: 'get',
})

today.definition = {
    methods: ["get","head"],
    url: '/accounting/journal-vouchers/today',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
 */
today.url = (options?: RouteQueryOptions) => {
    return today.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
 */
today.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: today.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
 */
today.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: today.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
 */
    const todayForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: today.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
 */
        todayForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: today.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\JournalVoucherController::today
 * @see app/Http/Controllers/JournalVoucherController.php:325
 * @route '/accounting/journal-vouchers/today'
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
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
 */
export const all = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})

all.definition = {
    methods: ["get","head"],
    url: '/accounting/journal-vouchers/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
 */
all.url = (options?: RouteQueryOptions) => {
    return all.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
 */
all.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: all.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
 */
all.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: all.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
 */
    const allForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: all.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
 */
        allForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: all.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\JournalVoucherController::all
 * @see app/Http/Controllers/JournalVoucherController.php:334
 * @route '/accounting/journal-vouchers/all'
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
/**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/accounting/journal-vouchers/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\JournalVoucherController::create
 * @see app/Http/Controllers/JournalVoucherController.php:14
 * @route '/accounting/journal-vouchers/create'
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
* @see \App\Http\Controllers\JournalVoucherController::store
 * @see app/Http/Controllers/JournalVoucherController.php:22
 * @route '/accounting/journal-vouchers'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/accounting/journal-vouchers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::store
 * @see app/Http/Controllers/JournalVoucherController.php:22
 * @route '/accounting/journal-vouchers'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JournalVoucherController::store
 * @see app/Http/Controllers/JournalVoucherController.php:22
 * @route '/accounting/journal-vouchers'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::store
 * @see app/Http/Controllers/JournalVoucherController.php:22
 * @route '/accounting/journal-vouchers'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\JournalVoucherController::store
 * @see app/Http/Controllers/JournalVoucherController.php:22
 * @route '/accounting/journal-vouchers'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
 */
export const invoices = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(options),
    method: 'get',
})

invoices.definition = {
    methods: ["get","head"],
    url: '/accounting/journal-vouchers/invoices',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
 */
invoices.url = (options?: RouteQueryOptions) => {
    return invoices.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
 */
invoices.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
 */
invoices.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoices.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
 */
    const invoicesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoices.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
 */
        invoicesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoices.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\JournalVoucherController::invoices
 * @see app/Http/Controllers/JournalVoucherController.php:284
 * @route '/accounting/journal-vouchers/invoices'
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
/**
* @see \App\Http\Controllers\JournalVoucherController::destroy
 * @see app/Http/Controllers/JournalVoucherController.php:214
 * @route '/accounting/journal-vouchers/{voucher}'
 */
export const destroy = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/accounting/journal-vouchers/{voucher}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::destroy
 * @see app/Http/Controllers/JournalVoucherController.php:214
 * @route '/accounting/journal-vouchers/{voucher}'
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
* @see \App\Http\Controllers\JournalVoucherController::destroy
 * @see app/Http/Controllers/JournalVoucherController.php:214
 * @route '/accounting/journal-vouchers/{voucher}'
 */
destroy.delete = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::destroy
 * @see app/Http/Controllers/JournalVoucherController.php:214
 * @route '/accounting/journal-vouchers/{voucher}'
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
* @see \App\Http\Controllers\JournalVoucherController::destroy
 * @see app/Http/Controllers/JournalVoucherController.php:214
 * @route '/accounting/journal-vouchers/{voucher}'
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
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
 */
export const edit = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/accounting/journal-vouchers/{voucher}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
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
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
 */
edit.get = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
 */
edit.head = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
 */
    const editForm = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
 */
        editForm.get = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\JournalVoucherController::edit
 * @see app/Http/Controllers/JournalVoucherController.php:138
 * @route '/accounting/journal-vouchers/{voucher}/edit'
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
* @see \App\Http\Controllers\JournalVoucherController::update
 * @see app/Http/Controllers/JournalVoucherController.php:164
 * @route '/accounting/journal-vouchers/{voucher}'
 */
export const update = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/accounting/journal-vouchers/{voucher}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\JournalVoucherController::update
 * @see app/Http/Controllers/JournalVoucherController.php:164
 * @route '/accounting/journal-vouchers/{voucher}'
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
* @see \App\Http\Controllers\JournalVoucherController::update
 * @see app/Http/Controllers/JournalVoucherController.php:164
 * @route '/accounting/journal-vouchers/{voucher}'
 */
update.put = (args: { voucher: string | number } | [voucher: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\JournalVoucherController::update
 * @see app/Http/Controllers/JournalVoucherController.php:164
 * @route '/accounting/journal-vouchers/{voucher}'
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
* @see \App\Http\Controllers\JournalVoucherController::update
 * @see app/Http/Controllers/JournalVoucherController.php:164
 * @route '/accounting/journal-vouchers/{voucher}'
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
const journalVouchers = {
    today: Object.assign(today, today),
all: Object.assign(all, all),
create: Object.assign(create, create),
store: Object.assign(store, store),
invoices: Object.assign(invoices, invoices),
destroy: Object.assign(destroy, destroy),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
}

export default journalVouchers