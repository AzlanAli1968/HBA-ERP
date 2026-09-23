import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/invoices/options/transfer-locations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\InvoiceController::store
 * @see app/Http/Controllers/InvoiceController.php:894
 * @route '/invoices/options/transfer-locations'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const transferLocations = {
    store: Object.assign(store, store),
}

export default transferLocations