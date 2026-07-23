<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
public function up() {
Schema::create('user_approvals', function (Blueprint $table) {
$table->id();
$table->string('email');
$table->string('full_name');
$table->string('division');
$table->string('status');
$table->timestamps();
});
}
public function down() { Schema::dropIfExists('user_approvals'); }
};
