<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/{any}', function () {
    return Inertia::render('Welcome');
})->where('any', '.*');
Route::get('/register/employee', function () { return Inertia::render('Welcome'); });
Route::get('/register/investor', function () { return Inertia::render('Welcome'); });

require __DIR__.'/auth.php';
