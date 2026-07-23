<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CustomRegisterController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', Password::defaults()],
            'role' => ['required', 'in:employee,investor'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Registrasi gagal. Pastikan data valid dan email belum digunakan.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'pending_verification',
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'message' => 'Registrasi berhasil, menunggu verifikasi admin.'
        ], 201);
    }
}
