import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
import clientwise6cd14f from './clientwise'
import differenceEa2a8a from './difference'
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
export const clientwise = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwise.url(options),
    method: 'get',
})

clientwise.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/clientwise',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
clientwise.url = (options?: RouteQueryOptions) => {
    return clientwise.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
clientwise.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: clientwise.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
clientwise.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: clientwise.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
    const clientwiseForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: clientwise.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
        clientwiseForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwise.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::clientwise
 * @see app/Http/Controllers/ClearanceReportsController.php:22
 * @route '/accounting/clearance/clientwise'
 */
        clientwiseForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: clientwise.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    clientwise.form = clientwiseForm
/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
export const difference = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: difference.url(options),
    method: 'get',
})

difference.definition = {
    methods: ["get","head"],
    url: '/accounting/clearance/difference',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
difference.url = (options?: RouteQueryOptions) => {
    return difference.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
difference.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: difference.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
difference.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: difference.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
    const differenceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: difference.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
        differenceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: difference.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ClearanceReportsController::difference
 * @see app/Http/Controllers/ClearanceReportsController.php:172
 * @route '/accounting/clearance/difference'
 */
        differenceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: difference.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    difference.form = differenceForm
const clearance = {
    clientwise: Object.assign(clientwise, clientwise6cd14f),
difference: Object.assign(difference, differenceEa2a8a),
}

export default clearance