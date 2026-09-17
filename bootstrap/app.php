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
         * WHATSAPP BOT CSRF EXCLUSIONS
         * ----------------------------------------------------------
         *
         * The WhatsApp bot is an external Bearer-token client, not
         * a browser session. Exclude only its document API routes
         * from Laravel's web CSRF/request-forgery middleware.
         *
         * The browser control endpoints (/api/whatsapp-bot/start,
         * /groups, /logout, etc.) remain protected by the normal
         * authenticated web middleware.
         */
        $middleware->validateCsrfTokens(
            except: [
                'api/whatsapp-bot/documents/*',
                'whatsapp-bot/documents/*',
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
