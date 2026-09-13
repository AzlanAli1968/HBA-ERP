import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/accounts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountController::index
 * @see app/Http/Controllers/AccountController.php:16
 * @route '/accounts'
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
* @see \App\Http\Controllers\AccountController::store
 * @see app/Http/Controllers/AccountController.php:105
 * @route '/accounts'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/accounts',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AccountController::store
 * @see app/Http/Controllers/AccountController.php:105
 * @route '/accounts'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::store
 * @see app/Http/Controllers/AccountController.php:105
 * @route '/accounts'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\AccountController::store
 * @see app/Http/Controllers/AccountController.php:105
 * @route '/accounts'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AccountController::store
 * @see app/Http/Controllers/AccountController.php:105
 * @route '/accounts'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
export const show = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/accounts/{account}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
show.url = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { account: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { account: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    account: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        account: typeof args.account === 'object'
                ? args.account.id
                : args.account,
                }

    return show.definition.url
            .replace('{account}', parsedArgs.account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
show.get = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
show.head = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
    const showForm = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
        showForm.get = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountController::show
 * @see app/Http/Controllers/AccountController.php:189
 * @route '/accounts/{account}'
 */
        showForm.head = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
export const opening = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: opening.url(args, options),
    method: 'get',
})

opening.definition = {
    methods: ["get","head"],
    url: '/accounts/{account}/opening',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
opening.url = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { account: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { account: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    account: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        account: typeof args.account === 'object'
                ? args.account.id
                : args.account,
                }

    return opening.definition.url
            .replace('{account}', parsedArgs.account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
opening.get = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: opening.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
opening.head = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: opening.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
    const openingForm = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: opening.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
        openingForm.get = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: opening.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountController::opening
 * @see app/Http/Controllers/AccountController.php:209
 * @route '/accounts/{account}/opening'
 */
        openingForm.head = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: opening.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    opening.form = openingForm
/**
* @see \App\Http\Controllers\AccountController::updateOpening
 * @see app/Http/Controllers/AccountController.php:260
 * @route '/accounts/{account}/opening'
 */
export const updateOpening = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOpening.url(args, options),
    method: 'put',
})

updateOpening.definition = {
    methods: ["put"],
    url: '/accounts/{account}/opening',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AccountController::updateOpening
 * @see app/Http/Controllers/AccountController.php:260
 * @route '/accounts/{account}/opening'
 */
updateOpening.url = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { account: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { account: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    account: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        account: typeof args.account === 'object'
                ? args.account.id
                : args.account,
                }

    return updateOpening.definition.url
            .replace('{account}', parsedArgs.account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::updateOpening
 * @see app/Http/Controllers/AccountController.php:260
 * @route '/accounts/{account}/opening'
 */
updateOpening.put = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateOpening.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\AccountController::updateOpening
 * @see app/Http/Controllers/AccountController.php:260
 * @route '/accounts/{account}/opening'
 */
    const updateOpeningForm = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateOpening.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AccountController::updateOpening
 * @see app/Http/Controllers/AccountController.php:260
 * @route '/accounts/{account}/opening'
 */
        updateOpeningForm.put = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateOpening.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateOpening.form = updateOpeningForm
/**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
export const invoices = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(args, options),
    method: 'get',
})

invoices.definition = {
    methods: ["get","head"],
    url: '/accounts/{account}/invoices',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
invoices.url = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { account: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { account: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    account: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        account: typeof args.account === 'object'
                ? args.account.id
                : args.account,
                }

    return invoices.definition.url
            .replace('{account}', parsedArgs.account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
invoices.get = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invoices.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
invoices.head = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invoices.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
    const invoicesForm = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: invoices.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
        invoicesForm.get = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoices.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AccountController::invoices
 * @see app/Http/Controllers/AccountController.php:235
 * @route '/accounts/{account}/invoices'
 */
        invoicesForm.head = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: invoices.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    invoices.form = invoicesForm
/**
* @see \App\Http\Controllers\AccountController::update
 * @see app/Http/Controllers/AccountController.php:353
 * @route '/accounts/{account}'
 */
export const update = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/accounts/{account}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\AccountController::update
 * @see app/Http/Controllers/AccountController.php:353
 * @route '/accounts/{account}'
 */
update.url = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { account: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { account: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    account: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        account: typeof args.account === 'object'
                ? args.account.id
                : args.account,
                }

    return update.definition.url
            .replace('{account}', parsedArgs.account.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AccountController::update
 * @see app/Http/Controllers/AccountController.php:353
 * @route '/accounts/{account}'
 */
update.put = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\AccountController::update
 * @see app/Http/Controllers/AccountController.php:353
 * @route '/accounts/{account}'
 */
    const updateForm = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AccountController::update
 * @see app/Http/Controllers/AccountController.php:353
 * @route '/accounts/{account}'
 */
        updateForm.put = (args: { account: number | { id: number } } | [account: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const AccountController = { index, store, show, opening, updateOpening, invoices, update }

export default AccountController