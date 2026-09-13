import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import voucher from './voucher'
import options from './options'
/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/invoices',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::index
 * @see app/Http/Controllers/InvoiceController.php:22
 * @route '/invoices'
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
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/invoices/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::create
 * @see app/Http/Controllers/InvoiceController.php:1021
 * @route '/invoices/create'
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
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2171
 * @route '/invoices'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/invoices',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2171
 * @route '/invoices'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2171
 * @route '/invoices'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2171
 * @route '/invoices'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:2171
 * @route '/invoices'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
export const lines = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lines.url(args, options),
    method: 'get',
})

lines.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/lines',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
lines.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return lines.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
lines.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lines.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
lines.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: lines.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
    const linesForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: lines.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
        linesForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: lines.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::lines
 * @see app/Http/Controllers/InvoiceController.php:237
 * @route '/invoices/{invoice}/lines'
 */
        linesForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: lines.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    lines.form = linesForm
/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
export const print = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
print.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return print.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
print.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
print.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
    const printForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
        printForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:363
 * @route '/invoices/{invoice}/print'
 */
        printForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    print.form = printForm
/**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
export const pdf = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
pdf.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return pdf.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
pdf.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
pdf.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
    const pdfForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
        pdfForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:378
 * @route '/invoices/{invoice}/pdf'
 */
        pdfForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pdf.form = pdfForm
/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
export const edit = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
edit.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return edit.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
edit.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
edit.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
    const editForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
        editForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::edit
 * @see app/Http/Controllers/InvoiceController.php:1218
 * @route '/invoices/{invoice}/edit'
 */
        editForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
export const show = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
show.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return show.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
show.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
show.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
    const showForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
        showForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::show
 * @see app/Http/Controllers/InvoiceController.php:1033
 * @route '/invoices/{invoice}'
 */
        showForm.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7162
 * @route '/invoices/{invoice}'
 */
export const update = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/invoices/{invoice}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7162
 * @route '/invoices/{invoice}'
 */
update.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return update.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7162
 * @route '/invoices/{invoice}'
 */
update.put = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7162
 * @route '/invoices/{invoice}'
 */
    const updateForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::update
 * @see app/Http/Controllers/InvoiceController.php:7162
 * @route '/invoices/{invoice}'
 */
        updateForm.put = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7254
 * @route '/invoices/{invoice}'
 */
export const destroy = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/invoices/{invoice}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7254
 * @route '/invoices/{invoice}'
 */
destroy.url = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invoice: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    invoice: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invoice: args.invoice,
                }

    return destroy.definition.url
            .replace('{invoice}', parsedArgs.invoice.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7254
 * @route '/invoices/{invoice}'
 */
destroy.delete = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7254
 * @route '/invoices/{invoice}'
 */
    const destroyForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::destroy
 * @see app/Http/Controllers/InvoiceController.php:7254
 * @route '/invoices/{invoice}'
 */
        destroyForm.delete = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const invoices = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
lines: Object.assign(lines, lines),
print: Object.assign(print, print),
pdf: Object.assign(pdf, pdf),
voucher: Object.assign(voucher, voucher),
edit: Object.assign(edit, edit),
show: Object.assign(show, show),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
options: Object.assign(options, options),
}

export default invoices