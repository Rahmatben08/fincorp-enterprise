<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UserManagementController extends Controller
{
    /**
     * Dapatkan user yang menunggu persetujuan (pending_verification)
     */
    public function getPendingUsers(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::where('status', 'pending_verification')
            ->select('id', 'name', 'email', 'status', 'created_at', 'role')
            ->get();
            
        $users->map(function ($user) {
            $user->spatie_role = $user->getRoleNames()->first();
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Dapatkan user aktif dan role mereka
     */
    public function getActiveUsers(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::where('status', '!=', 'pending_verification')
            ->select('id', 'name', 'email', 'status', 'created_at', 'role')
            ->get();

        $users->map(function ($user) {
            $user->spatie_role = $user->getRoleNames()->first();
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Setujui user (ubah status dari pending_verification ke active)
     */
    public function approve($id, Request $request): JsonResponse
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized. Hanya Superadmin yang dapat menyetujui akun.'], 403);
        }

        $user = User::findOrFail($id);
        $user->status = 'active';
        $user->verified_by = $request->user()->id;
        $user->verified_at = Carbon::now();
        $user->save();

        return response()->json([
            'message' => 'Akun ' . $user->name . ' berhasil disetujui.',
            'user' => $user
        ]);
    }

    /**
     * Tolak user (ubah status ke rejected)
     */
    public function reject($id, Request $request): JsonResponse
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $user = User::findOrFail($id);
        $user->status = 'rejected';
        $user->save();

        return response()->json(['message' => 'Akun telah ditolak.']);
    }

    /**
     * Nonaktifkan user (ubah status ke inactive)
     */
    public function deactivate($id, Request $request): JsonResponse
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->role === 'superadmin') {
            return response()->json(['message' => 'Superadmin tidak dapat dinonaktifkan.'], 403);
        }

        $user->status = 'inactive';
        $user->save();

        return response()->json(['message' => 'Akun ' . $user->name . ' telah dinonaktifkan.']);
    }
}
