<?php

namespace App\Http\Controllers;

use App\Models\CompanyBank;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyBankController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $setting = CompanySetting::current();

        $bank = new CompanyBank();
        $bank->company_setting_id = (int) $setting->id;
        $this->fillBank($bank, $data);

        if ($request->hasFile('logo')) {
            $bank->logo_path = $request->file('logo')->store('company/banks', 'public');
        }

        $bank->save();

        return $this->backWithMessage('Bank account added successfully.');
    }

    public function update(Request $request, CompanyBank $bank): RedirectResponse
    {
        $this->guardCurrentCompany($bank);

        $data = $this->validated($request);
        $oldLogo = $bank->logo_path;
        $this->fillBank($bank, $data);

        if ($request->hasFile('logo')) {
            $bank->logo_path = $request->file('logo')->store('company/banks', 'public');
        } elseif ($request->boolean('remove_logo')) {
            $bank->logo_path = null;
        }

        $bank->save();

        if ($oldLogo && $bank->logo_path !== $oldLogo && ! str_starts_with($oldLogo, 'http')) {
            Storage::disk('public')->delete($oldLogo);
        }

        return $this->backWithMessage('Bank account updated successfully.');
    }

    public function destroy(CompanyBank $bank): RedirectResponse
    {
        $this->guardCurrentCompany($bank);

        $logo = $bank->logo_path;
        $bank->delete();

        if ($logo && ! str_starts_with($logo, 'http')) {
            Storage::disk('public')->delete($logo);
        }

        return $this->backWithMessage('Bank account removed successfully.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'label' => ['nullable', 'string', 'max:100'],
            'bank_name' => ['required', 'string', 'max:255'],
            'account_title' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'iban' => ['nullable', 'string', 'max:100'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'swift_code' => ['nullable', 'string', 'max:50'],
            'currency_code' => ['nullable', 'string', 'max:20'],
            'is_active' => ['required', 'boolean'],
            'show_on_documents' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);
    }

    private function fillBank(CompanyBank $bank, array $data): void
    {
        $bank->label = $data['label'] ?? null;
        $bank->bank_name = trim((string) $data['bank_name']);
        $bank->account_title = $this->nullableText($data['account_title'] ?? null);
        $bank->account_number = $this->nullableText($data['account_number'] ?? null);
        $bank->iban = $this->nullableText($data['iban'] ?? null);
        $bank->branch_name = $this->nullableText($data['branch_name'] ?? null);
        $bank->swift_code = $this->nullableText($data['swift_code'] ?? null);
        $bank->currency_code = $this->nullableUpper($data['currency_code'] ?? null);
        $bank->is_active = (bool) $data['is_active'];
        $bank->show_on_documents = (bool) $data['show_on_documents'];
        $bank->sort_order = (int) $data['sort_order'];
    }

    private function nullableText(?string $value): ?string
    {
        $value = trim((string) ($value ?? ''));
        return $value === '' ? null : $value;
    }

    private function nullableUpper(?string $value): ?string
    {
        $value = $this->nullableText($value);
        return $value === null ? null : strtoupper($value);
    }

    private function guardCurrentCompany(CompanyBank $bank): void
    {
        abort_unless(
            (int) $bank->company_setting_id === (int) CompanySetting::current()->id,
            404
        );
    }

    private function backWithMessage(string $message): RedirectResponse
    {
        return redirect()
            ->route('admin.settings.edit')
            ->with('success', $message);
    }
}
