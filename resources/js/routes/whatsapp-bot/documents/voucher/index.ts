import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
import pdf81d01d from './pdf'
import create4f58d6 from './create'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
export const pdf = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/documents/voucher/{reference}/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
pdf.url = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return pdf.definition.url
            .replace('{reference}', parsedArgs.reference.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
pdf.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
pdf.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
    const pdfForm = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        pdfForm.get = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:43
 * @route '/api/whatsapp-bot/documents/voucher/{reference}/pdf'
 */
        pdfForm.head = (args: { reference: string | number } | [reference: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

create.definition = {
    methods: ["post"],
    url: '/api/whatsapp-bot/documents/voucher/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
create.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: create.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: create.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::create
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:71
 * @route '/api/whatsapp-bot/documents/voucher/create'
 */
        createForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: create.url(options),
            method: 'post',
        })
    
    create.form = createForm
const voucher = {
    pdf: Object.assign(pdf, pdf81d01d),
create: Object.assign(create, create4f58d6),
}

export default voucher