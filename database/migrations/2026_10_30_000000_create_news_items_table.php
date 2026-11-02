<?php
// Save as: database/migrations/2026_10_30_000000_create_news_items_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('news_items', function (Blueprint $table) {
            $table->id();
            $table->string('type', 10)->default('article');      // article | video
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('url');
            $table->char('url_hash', 40)->unique();               // stops duplicates
            $table->text('image_url')->nullable();
            $table->string('video_id', 20)->nullable();           // YouTube id
            $table->string('source_name')->nullable();
            $table->string('region', 20)->default('global');      // perlis | malaysia | global
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_items');
    }
};
