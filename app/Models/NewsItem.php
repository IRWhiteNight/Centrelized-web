<?php
// Save as: app/Models/NewsItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsItem extends Model
{
    protected $fillable = [
        'type', 'title', 'description', 'url', 'url_hash', 'image_url',
        'video_id', 'source_name', 'region', 'is_featured', 'published_at',
    ];

    protected $casts = [
        'is_featured'  => 'boolean',
        'published_at' => 'datetime',
    ];
}
