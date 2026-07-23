<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
public function up() {
Schema::create('vendor_invoices', function (Blueprint $table) {
$table->id();
$table->string('vendor');
$table->string('invoice_number');
$table->string('amount');
$table->string('due_date');
$table->string('status');
$table->timestamps();
});
}
public function down() { Schema::dropIfExists('vendor_invoices'); }
};
