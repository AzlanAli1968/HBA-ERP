<?php

Route::middleware('auth')->group(function (): void {
    Route::get('/admin/users', [\App\Http\Controllers\Admin\AdminUsersController::class, 'index'])
        ->name('admin.users.index');
    Route::post('/admin/users', [\App\Http\Controllers\Admin\AdminUsersController::class, 'store'])
        ->name('admin.users.store');
    Route::put('/admin/users/{user}', [\App\Http\Controllers\Admin\AdminUsersController::class, 'update'])
        ->name('admin.users.update');
    Route::delete('/admin/users/{user}', [\App\Http\Controllers\Admin\AdminUsersController::class, 'destroy'])
        ->name('admin.users.destroy');

    Route::get('/admin/roles', [\App\Http\Controllers\Admin\AdminRolesController::class, 'index'])
        ->name('admin.roles.index');
    Route::post('/admin/roles', [\App\Http\Controllers\Admin\AdminRolesController::class, 'store'])
        ->name('admin.roles.store');
    Route::put('/admin/roles/{role}', [\App\Http\Controllers\Admin\AdminRolesController::class, 'update'])
        ->name('admin.roles.update');
    Route::delete('/admin/roles/{role}', [\App\Http\Controllers\Admin\AdminRolesController::class, 'destroy'])
        ->name('admin.roles.destroy');
});
