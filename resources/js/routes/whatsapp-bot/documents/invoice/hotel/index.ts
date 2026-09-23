import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
import add26698a from './add'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
export const add = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

add.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
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
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
add.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: add.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
    const addForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: add.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::add
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1758
 * @route '/api/whatsapp-bot/documents/invoice/{reference}/hotel/add'
 */
        addForm.post = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: add.url(args, options),
            method: 'post',
        })
    
    add.form = addForm
const hotel = {
    add: Object.assign(add, add26698a),
}

export default hotel