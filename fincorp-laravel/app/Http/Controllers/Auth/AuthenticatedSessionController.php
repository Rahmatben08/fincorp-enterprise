<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $request->authenticate();
        $user = Auth::user();

        // Cek status akun (pending_verification, rejected, inactive)
        if (in_array($user->status, ['pending_verification', 'rejected', 'inactive'])) {
            $statusMsg = 'Akun Anda sedang menunggu verifikasi Superadmin.';
            if ($user->status === 'rejected') $statusMsg = 'Pendaftaran akun Anda ditolak.';
            if ($user->status === 'inactive') $statusMsg = 'Akun Anda dinonaktifkan.';
            
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return response()->json([
                'message' => $statusMsg
            ], 403);
        }

        // Validasi wajib intended_role_group
        $intendedRoleGroup = $request->input('intended_role_group');
        if (empty($intendedRoleGroup) || !$user->hasAnyRole($intendedRoleGroup)) {
            // Log ke audit_logs
            DB::table('audit_logs')->insert([
                'timestamp' => now()->toDateTimeString(),
                'user' => $user->name,
                'action' => 'failed_login_wrong_role',
                'description' => 'User attempted login with role group: ' . (is_array($intendedRoleGroup) ? implode(',', $intendedRoleGroup) : ($intendedRoleGroup ?? 'NONE_PROVIDED')),
                'created_at' => now(),
            ]);

            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Role Anda tidak sesuai dengan kategori ini atau parameter role hilang.'
            ], 403);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login berhasil',
            'user' => $user,
            'redirect_url' => '/dashboard'
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
