<?php

namespace App\Http\Controllers;

use App\Services\Admin\AdminAnalyticsService;

class AdminController extends Controller
{
    public function dashboard(AdminAnalyticsService $analytics)
    {
        return response()->json($analytics->dashboard());
    }
}
