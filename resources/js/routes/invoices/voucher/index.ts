import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
 */
export const print = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})

print.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/voucher/print',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
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
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
 */
print.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: print.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
 */
print.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: print.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
 */
    const printForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: print.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
 */
        printForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: print.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::print
 * @see app/Http/Controllers/InvoiceController.php:398
 * @route '/invoices/{invoice}/voucher/print'
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
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
 */
export const pdf = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})

pdf.definition = {
    methods: ["get","head"],
    url: '/invoices/{invoice}/voucher/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
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
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
 */
pdf.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pdf.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
 */
pdf.head = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pdf.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
 */
    const pdfForm = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: pdf.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
 */
        pdfForm.get = (args: { invoice: string | number } | [invoice: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: pdf.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\InvoiceController::pdf
 * @see app/Http/Controllers/InvoiceController.php:413
 * @route '/invoices/{invoice}/voucher/pdf'
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
const voucher = {
    print: Object.assign(print, print),
pdf: Object.assign(pdf, pdf),
}

export default voucher