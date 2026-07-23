<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
public function up() {
Schema::create('audit_logs', function (Blueprint $table) {
$table->id();
$table->string('timestamp');
$table->string('user');
$table->string('action');
$table->string('description');
$table->timestamps();
});
}
public function down() { Schema::dropIfExists('audit_logs'); }
};
