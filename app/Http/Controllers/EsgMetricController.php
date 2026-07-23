<?php

namespace App\Http\Controllers;

use App\Models\EsgMetric;
use Illuminate\Http\Request;

class EsgMetricController extends Controller
{
    public function index()
    {
        return response()->json(EsgMetric::all());
    }
}
