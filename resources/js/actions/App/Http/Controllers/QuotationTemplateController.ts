import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/quotation-templates',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationTemplateController::index
 * @see app/Http/Controllers/QuotationTemplateController.php:21
 * @route '/quotation-templates'
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
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/quotation-templates/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationTemplateController::create
 * @see app/Http/Controllers/QuotationTemplateController.php:145
 * @route '/quotation-templates/create'
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
* @see \App\Http\Controllers\QuotationTemplateController::store
 * @see app/Http/Controllers/QuotationTemplateController.php:158
 * @route '/quotation-templates'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quotation-templates',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuotationTemplateController::store
 * @see app/Http/Controllers/QuotationTemplateController.php:158
 * @route '/quotation-templates'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationTemplateController::store
 * @see app/Http/Controllers/QuotationTemplateController.php:158
 * @route '/quotation-templates'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuotationTemplateController::store
 * @see app/Http/Controllers/QuotationTemplateController.php:158
 * @route '/quotation-templates'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuotationTemplateController::store
 * @see app/Http/Controllers/QuotationTemplateController.php:158
 * @route '/quotation-templates'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
export const edit = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/quotation-templates/{quotationTemplate}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
edit.url = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotationTemplate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quotationTemplate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quotationTemplate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quotationTemplate: typeof args.quotationTemplate === 'object'
                ? args.quotationTemplate.id
                : args.quotationTemplate,
                }

    return edit.definition.url
            .replace('{quotationTemplate}', parsedArgs.quotationTemplate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
edit.get = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
edit.head = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
    const editForm = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
        editForm.get = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuotationTemplateController::edit
 * @see app/Http/Controllers/QuotationTemplateController.php:282
 * @route '/quotation-templates/{quotationTemplate}/edit'
 */
        editForm.head = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\QuotationTemplateController::update
 * @see app/Http/Controllers/QuotationTemplateController.php:310
 * @route '/quotation-templates/{quotationTemplate}'
 */
export const update = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/quotation-templates/{quotationTemplate}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\QuotationTemplateController::update
 * @see app/Http/Controllers/QuotationTemplateController.php:310
 * @route '/quotation-templates/{quotationTemplate}'
 */
update.url = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotationTemplate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quotationTemplate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quotationTemplate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quotationTemplate: typeof args.quotationTemplate === 'object'
                ? args.quotationTemplate.id
                : args.quotationTemplate,
                }

    return update.definition.url
            .replace('{quotationTemplate}', parsedArgs.quotationTemplate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationTemplateController::update
 * @see app/Http/Controllers/QuotationTemplateController.php:310
 * @route '/quotation-templates/{quotationTemplate}'
 */
update.put = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\QuotationTemplateController::update
 * @see app/Http/Controllers/QuotationTemplateController.php:310
 * @route '/quotation-templates/{quotationTemplate}'
 */
    const updateForm = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuotationTemplateController::update
 * @see app/Http/Controllers/QuotationTemplateController.php:310
 * @route '/quotation-templates/{quotationTemplate}'
 */
        updateForm.put = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\QuotationTemplateController::destroy
 * @see app/Http/Controllers/QuotationTemplateController.php:450
 * @route '/quotation-templates/{quotationTemplate}'
 */
export const destroy = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/quotation-templates/{quotationTemplate}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\QuotationTemplateController::destroy
 * @see app/Http/Controllers/QuotationTemplateController.php:450
 * @route '/quotation-templates/{quotationTemplate}'
 */
destroy.url = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quotationTemplate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quotationTemplate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quotationTemplate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quotationTemplate: typeof args.quotationTemplate === 'object'
                ? args.quotationTemplate.id
                : args.quotationTemplate,
                }

    return destroy.definition.url
            .replace('{quotationTemplate}', parsedArgs.quotationTemplate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuotationTemplateController::destroy
 * @see app/Http/Controllers/QuotationTemplateController.php:450
 * @route '/quotation-templates/{quotationTemplate}'
 */
destroy.delete = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\QuotationTemplateController::destroy
 * @see app/Http/Controllers/QuotationTemplateController.php:450
 * @route '/quotation-templates/{quotationTemplate}'
 */
    const destroyForm = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuotationTemplateController::destroy
 * @see app/Http/Controllers/QuotationTemplateController.php:450
 * @route '/quotation-templates/{quotationTemplate}'
 */
        destroyForm.delete = (args: { quotationTemplate: number | { id: number } } | [quotationTemplate: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const QuotationTemplateController = { index, create, store, edit, update, destroy }

export default QuotationTemplateController