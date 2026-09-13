import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import salesF8b092 from './sales'
import otherF1a1de from './other'
import financial from './financial'
/**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
export const sales = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sales.url(options),
    method: 'get',
})

sales.definition = {
    methods: ["get","head"],
    url: '/reports/sales',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
sales.url = (options?: RouteQueryOptions) => {
    return sales.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
sales.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sales.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
sales.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sales.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
    const salesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: sales.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
        salesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sales.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SalesReportsController::sales
 * @see app/Http/Controllers/SalesReportsController.php:28
 * @route '/reports/sales'
 */
        salesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: sales.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    sales.form = salesForm
/**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
export const other = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: other.url(options),
    method: 'get',
})

other.definition = {
    methods: ["get","head"],
    url: '/reports/other',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
other.url = (options?: RouteQueryOptions) => {
    return other.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
other.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: other.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
other.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: other.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
    const otherForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: other.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
        otherForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: other.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OtherReportsController::other
 * @see app/Http/Controllers/OtherReportsController.php:26
 * @route '/reports/other'
 */
        otherForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: other.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    other.form = otherForm
const reports = {
    sales: Object.assign(sales, salesF8b092),
other: Object.assign(other, otherF1a1de),
financial: Object.assign(financial, financial),
}

export default reports