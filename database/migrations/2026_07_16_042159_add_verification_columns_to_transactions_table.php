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
        Schema::table('transactions', function (Blueprint $table) {
            // Because SQLite has issues dropping and changing enums natively in older versions, 
            // and we're just expanding the status, it's safer to recreate the status column as a string or use string->change in modern Laravel.
            $table->string('status')->default('draft')->change();
            
            $table->foreignId('verified_by')->nullable()->after('created_by')->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable()->after('verified_by');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn(['verified_by', 'verified_at', 'approved_at']);
        });
    }
};
