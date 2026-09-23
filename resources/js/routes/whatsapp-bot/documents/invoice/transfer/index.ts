import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
import create4f58d6 from './create'
import add26698a from './add'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

create.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/transfer/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
create.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: create.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1935
 * @route '/api/whatsapp-bot/documents/invoice/transfer/create'
 */
        createForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: create.url(options),
            method: 'post',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
export const add = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

add.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
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
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
add.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
    const addForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: add.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1984
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/transfer/add'
 */
        addForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: add.url(args, options),
            method: 'post',
        })
    
    add.form = addForm
const transfer = {
    create: Object.assign(create, create4f58d6),
add: Object.assign(add, add26698a),
}

export default transfer