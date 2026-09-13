import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

create.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/visa/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
create.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: create.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1779
 * @route '/whatsapp-bot/documents/invoice/visa/create'
 */
        createForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: create.url(options),
            method: 'post',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
export const add = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

add.definition = {
    methods: ["post"],
    url: '/whatsapp-bot/documents/invoice/{reference}/visa/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
add.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reference: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    reference: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reference: args.reference,
                }

    return add.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
add.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
    const addForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: add.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1828
 * @route '/whatsapp-bot/documents/invoice/{reference}/visa/add'
 */
        addForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: add.url(args, options),
            method: 'post',
        })
    
    add.form = addForm
const visa = {
    create: Object.assign(create, create),
add: Object.assign(add, add),
}

export default visa