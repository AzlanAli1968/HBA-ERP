import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
import pdf81d01d from './pdf'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
export const pdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/api/whatsapp-bot/documents/other-report/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
pdf.url = (options?: RouteQueryOptions) => {
    return pdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
pdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
pdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
    const pdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
        pdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::pdf
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1249
 * @route '/api/whatsapp-bot/documents/other-report/pdf'
 */
        pdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    pdf.form = pdfForm
const otherReport = {
    pdf: Object.assign(pdf, pdf81d01d),
}

export default otherReport