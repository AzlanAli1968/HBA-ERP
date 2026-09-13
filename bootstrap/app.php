<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(
    basePath: dirname(__DIR__)
)
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * ----------------------------------------------------------
         * COOKIE ENCRYPTION
         * ----------------------------------------------------------
         */
        $middleware->encryptCookies(
            except: [
                'appearance',
                'sidebar_state',
            ],
        );

        /*
         * ----------------------------------------------------------
         * WEB MIDDLEWARE
         * ----------------------------------------------------------
         *
         * Preserve the existing application middleware.
         */
        $middleware->web(
            append: [
                HandleAppearance::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ],
        );

        /*
         * ----------------------------------------------------------
         * CSRF EXCLUSIONS
         * ----------------------------------------------------------
         *
         * These endpoints are called by the local WhatsApp bot.
         * The bot authenticates with WHATSAPP_BOT_TOKEN rather
         * than a browser CSRF token.
         *
         * Keep these exclusions limited to WhatsApp bot endpoints.
         */
        $middleware->validateCsrfTokens(
    except: [
        'whatsapp-bot/documents/voucher/create',
        'whatsapp-bot/documents/journal-voucher/create',
        'whatsapp-bot/documents/invoice/create',
        'whatsapp-bot/documents/invoice/*/hotel/add',
        'whatsapp-bot/documents/invoice/visa/create',
        'whatsapp-bot/documents/invoice/*/visa/add',
        'whatsapp-bot/documents/invoice/transfer/create',
        'whatsapp-bot/documents/invoice/*/transfer/add',
    ],
);
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        /*
         * ----------------------------------------------------------
         * JSON ERROR RESPONSES
         * ----------------------------------------------------------
         *
         * Preserve the existing behavior for API / AJAX requests.
         */
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool =>
                $request->is('api/*')
                || $request->expectsJson(),
        );
    })

    ->create();