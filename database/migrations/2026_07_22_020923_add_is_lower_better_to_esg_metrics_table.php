<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('esg_metrics', function (Blueprint $table) {
            $table->boolean('is_lower_better')->default(false)->after('trend');
        });

        // Set is_lower_better to true for Carbon Emissions
        DB::table('esg_metrics')
            ->where('metric', 'like', '%Emisi Karbon%')
            ->update(['is_lower_better' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('esg_metrics', function (Blueprint $table) {
            $table->dropColumn('is_lower_better');
        });
    }
};
