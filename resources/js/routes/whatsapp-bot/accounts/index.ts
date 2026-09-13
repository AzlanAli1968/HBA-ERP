import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
export const type = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: type.url(args, options),
    method: 'get',
})

type.definition = {
    methods: ["get","head"],
    url: '/whatsapp-bot/accounts/type/{alias}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
type.url = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { alias: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    alias: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        alias: args.alias,
                }

    return type.definition.url
            .replace('{alias}', parsedArgs.alias.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
type.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: type.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
type.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: type.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
    const typeForm = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: type.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
        typeForm.get = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: type.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\WhatsAppBotDocumentController::type
 * @see app/Http/Controllers/WhatsAppBotDocumentController.php:1558
 * @route '/whatsapp-bot/accounts/type/{alias}'
 */
        typeForm.head = (args: { alias: string | number } | [alias: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: type.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    type.form = typeForm
const accounts = {
    type: Object.assign(type, type),
}

export default accounts