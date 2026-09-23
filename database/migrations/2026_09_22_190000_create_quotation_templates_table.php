<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('quotation_templates')) {
            return;
        }

        Schema::create('quotation_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('paper_size', 20)->default('A4');
            $table->string('orientation', 20)->default('portrait');
            $table->longText('design_json')->nullable();
            $table->boolean('is_default')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_templates');
    }
};
