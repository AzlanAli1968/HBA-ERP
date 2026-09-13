<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use App\Services\CompanySettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    public function edit(CompanySettingsService $companySettings): Response
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => $companySettings->formData(),
            'banks' => $companySettings->bankData(),
        ]);
    }

    public function update(Request $request, CompanySettingsService $companySettings): RedirectResponse
    {
        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:100'],
            'mobile' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'govt_license' => ['nullable', 'string', 'max:100'],
            'ntn' => ['nullable', 'string', 'max:100'],

            'document_notes' => ['nullable', 'string', 'max:5000'],
            'document_footer' => ['nullable', 'string', 'max:5000'],

            'base_currency_code' => ['required', 'string', 'max:20'],
            'decimal_places' => ['required', 'integer', 'min:0', 'max:4'],
            'paper_size' => ['required', 'in:A4,A5,Letter'],
            'print_orientation' => ['required', 'in:portrait,landscape'],

            'show_company_header' => ['required', 'boolean'],
            'show_address' => ['required', 'boolean'],
            'show_phone' => ['required', 'boolean'],
            'show_email' => ['required', 'boolean'],
            'show_website' => ['required', 'boolean'],
            'show_govt_license' => ['required', 'boolean'],
            'show_ntn' => ['required', 'boolean'],
            'show_qr' => ['required', 'boolean'],

            'logo' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'qr' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],

            'remove_logo' => ['nullable', 'boolean'],
            'remove_qr' => ['nullable', 'boolean'],
        ]);

        $setting = CompanySetting::current();

        DB::transaction(function () use ($request, $data, $setting): void {
            $setting->company_name = $data['company_name'];
            $setting->tagline = $data['tagline'] ?? null;
            $setting->address = $data['address'] ?? null;
            $setting->phone = $data['phone'] ?? null;
            $setting->mobile = $data['mobile'] ?? null;
            $setting->email = $data['email'] ?? null;
            $setting->website = $data['website'] ?? null;
            $setting->govt_license = $data['govt_license'] ?? null;
            $setting->ntn = $data['ntn'] ?? null;

            $setting->document_notes = $data['document_notes'] ?? null;
            $setting->document_footer = $data['document_footer'] ?? null;

            $setting->base_currency_code = strtoupper(trim((string) $data['base_currency_code']));
            $setting->decimal_places = (int) $data['decimal_places'];
            $setting->paper_size = $data['paper_size'];
            $setting->print_orientation = $data['print_orientation'];

            $setting->show_company_header = (bool) $data['show_company_header'];
            $setting->show_address = (bool) $data['show_address'];
            $setting->show_phone = (bool) $data['show_phone'];
            $setting->show_email = (bool) $data['show_email'];
            $setting->show_website = (bool) $data['show_website'];
            $setting->show_govt_license = (bool) $data['show_govt_license'];
            $setting->show_ntn = (bool) $data['show_ntn'];
            $setting->show_qr = (bool) $data['show_qr'];

            if ($request->hasFile('logo')) {
                $old = $setting->logo_path ?? null;
                $setting->logo_path = $request->file('logo')->store('company', 'public');

                if ($old && ! str_starts_with($old, 'http')) {
                    Storage::disk('public')->delete($old);
                }
            } elseif (! empty($data['remove_logo'])) {
                $old = $setting->logo_path ?? null;
                $setting->logo_path = null;

                if ($old && ! str_starts_with($old, 'http')) {
                    Storage::disk('public')->delete($old);
                }
            }

            if ($request->hasFile('qr')) {
                $old = $setting->qr_path ?? null;
                $setting->qr_path = $request->file('qr')->store('company', 'public');

                if ($old && ! str_starts_with($old, 'http')) {
                    Storage::disk('public')->delete($old);
                }
            } elseif (! empty($data['remove_qr'])) {
                $old = $setting->qr_path ?? null;
                $setting->qr_path = null;

                if ($old && ! str_starts_with($old, 'http')) {
                    Storage::disk('public')->delete($old);
                }
            }

            $setting->save();
        });

        return redirect()
            ->route('admin.settings.edit')
            ->with('success', 'Company settings updated successfully.');
    }
}
