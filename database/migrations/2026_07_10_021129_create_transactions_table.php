<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
public function up() {
Schema::create('transactions', function (Blueprint $table) {
$table->id();
$table->date('date');
$table->string('description');
$table->enum('type', ['income', 'expense']);
$table->decimal('amount', 15, 2);
$table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
$table->foreignId('created_by')->nullable()->constrained('users');
$table->foreignId('approved_by')->nullable()->constrained('users');
$table->timestamps();
});
}
public function down() { Schema::dropIfExists('transactions'); }
};
