import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/quotations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationController::index
 * @see app/Http/Controllers/QuotationController.php:24
 * @route '/quotations'
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
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/quotations/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationController::create
 * @see app/Http/Controllers/QuotationController.php:71
 * @route '/quotations/create'
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
* @see \App\Http\Controllers\QuotationController::store
 * @see app/Http/Controllers/QuotationController.php:175
 * @route '/quotations'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quotations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuotationController::store
 * @see app/Http/Controllers/QuotationController.php:175
 * @route '/quotations'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::store
 * @see app/Http/Controllers/QuotationController.php:175
 * @route '/quotations'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuotationController::store
 * @see app/Http/Controllers/QuotationController.php:175
 * @route '/quotations'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuotationController::store
 * @see app/Http/Controllers/QuotationController.php:175
 * @route '/quotations'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
export const show = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/quotations/{quotation}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
show.url = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotation: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quotation: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quotation: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quotation: typeof args.quotation === 'object'
                ? args.quotation.id
                : args.quotation,
                }

    return show.definition.url
            .replace('{quotation}', parsedArgs.quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
show.get = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
show.head = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
    const showForm = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
        showForm.get = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationController::show
 * @see app/Http/Controllers/QuotationController.php:1199
 * @route '/quotations/{quotation}'
 */
        showForm.head = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
export const pdf = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/quotations/{quotation}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
pdf.url = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotation: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quotation: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quotation: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quotation: typeof args.quotation === 'object'
                ? args.quotation.id
                : args.quotation,
                }

    return pdf.definition.url
            .replace('{quotation}', parsedArgs.quotation.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
pdf.get = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
pdf.head = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
    const pdfForm = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
        pdfForm.get = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationController::pdf
 * @see app/Http/Controllers/QuotationController.php:1288
 * @route '/quotations/{quotation}/pdf'
 */
        pdfForm.head = (args: { quotation: number | { id: number } } | [quotation: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pdf.form = pdfForm
const quotations = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
pdf: Object.assign(pdf, pdf),
}

export default quotations