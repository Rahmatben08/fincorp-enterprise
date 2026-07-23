<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool {
        return $this->user() && in_array($this->user()->role, ["superadmin", "admin_keuangan", "finance_staff", "manajer"]);
    }
    public function rules(): array {
        return [
            "date" => "required|date",
            "description" => "required|string|max:255",
            "type" => "required|in:income,expense",
            "amount" => "required|numeric|min:1",
            "status" => "nullable|string"
        ];
    }
}

