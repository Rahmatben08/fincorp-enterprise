<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')->nullable()->after('status');
                // Constraint foreign key agar jika superadmin dihapus, set null
                $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verified_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'verified_by')) {
                $table->dropForeign(['verified_by']);
                $table->dropColumn('verified_by');
            }
            if (Schema::hasColumn('users', 'verified_at')) {
                $table->dropColumn('verified_at');
            }
        });
    }
};
