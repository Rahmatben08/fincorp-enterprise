<?php
namespace App\Http\Controllers;
use App\Models\DivisionBudget;
use Illuminate\Http\Request;
class DivisionBudgetController extends Controller {
public function index() { return response()->json(DivisionBudget::all()); }
}
