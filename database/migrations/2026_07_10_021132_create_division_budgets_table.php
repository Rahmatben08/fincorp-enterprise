<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
public function up() {
Schema::create('division_budgets', function (Blueprint $table) {
$table->id();
$table->string('division');
$table->string('allocated');
$table->string('used');
$table->string('status');
$table->timestamps();
});
}
public function down() { Schema::dropIfExists('division_budgets'); }
};
