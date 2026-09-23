import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
import create4f58d6 from './create'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

create.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/journal-voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
create.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: create.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:692
 * @route '/api/whatsapp-bot/documents/journal-voucher/create'
 */
        createForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: create.url(options),
            method: 'post',
        })
    
    create.form = createForm
const journalVoucher = {
    create: Object.assign(create, create4f58d6),
}

export default journalVoucher