<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
public function up() {
Schema::create('payrolls', function (Blueprint $table) {
$table->id();
$table->string('employee');
$table->string('period');
$table->string('amount');
$table->string('status');
$table->timestamps();
});
}
public function down() { Schema::dropIfExists('payrolls'); }
};
