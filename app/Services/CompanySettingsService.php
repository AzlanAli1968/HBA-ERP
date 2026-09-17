<?php

namespace App\Services;

use App\Models\CompanyBank;
use App\Models\CompanySetting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class CompanySettingsService
{
    public function current(): CompanySetting
    {
        return CompanySetting::current();
    }

    public function formData(): array
    {
        $setting = $this->current();

        return [
            'id' => (int) $setting->id,
            'company_name' => (string) ($setting->company_name ?? ''),
            'tagline' => (string) ($setting->tagline ?? ''),
            'address' => (string) ($setting->address ?? ''),
            'phone' => (string) ($setting->phone ?? ''),
            'mobile' => (string) ($setting->mobile ?? ''),
            'email' => (string) ($setting->email ?? ''),
            'website' => (string) ($setting->website ?? ''),
            'govt_license' => (string) ($setting->govt_license ?? ''),
            'ntn' => (string) ($setting->ntn ?? ''),
            'document_notes' => (string) ($setting->document_notes ?? ''),
            'document_footer' => (string) ($setting->document_footer ?? ''),
            'base_currency_code' => (string) ($setting->base_currency_code ?? 'PKR'),
            'decimal_places' => (int) ($setting->decimal_places ?? 2),
            'paper_size' => (string) ($setting->paper_size ?? 'A4'),
            'print_orientation' => (string) ($setting->print_orientation ?? 'portrait'),
            'show_company_header' => (bool) ($setting->show_company_header ?? true),
            'show_address' => (bool) ($setting->show_address ?? true),
            'show_phone' => (bool) ($setting->show_phone ?? true),
            'show_email' => (bool) ($setting->show_email ?? true),
            'show_website' => (bool) ($setting->show_website ?? true),
            'show_govt_license' => (bool) ($setting->show_govt_license ?? true),
            'show_ntn' => (bool) ($setting->show_ntn ?? true),
            'show_qr' => (bool) ($setting->show_qr ?? true),
            'logo_url' => $this->storageUrl($setting->logo_path ?? null),
            'qr_url' => $this->storageUrl($setting->qr_path ?? null),
        ];
    }

    /**
     * Bank accounts belonging to the current company setting.
     *
     * These are kept separate from company_settings because a company can
     * publish multiple bank accounts, each with its own logo and details.
     */
    public function bankData(): array
    {
        if (! Schema::hasTable('company_banks')) {
            return [];
        }

        $companySettingId = (int) $this->current()->id;

        return CompanyBank::query()
            ->where('company_setting_id', $companySettingId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(function (CompanyBank $bank): array {
                return [
                    'id' => (int) $bank->id,
                    'label' => (string) ($bank->label ?? ''),
                    'bank_name' => (string) ($bank->bank_name ?? ''),
                    'account_title' => (string) ($bank->account_title ?? ''),
                    'account_number' => (string) ($bank->account_number ?? ''),
                    'iban' => (string) ($bank->iban ?? ''),
                    'branch_name' => (string) ($bank->branch_name ?? ''),
                    'swift_code' => (string) ($bank->swift_code ?? ''),
                    'currency_code' => (string) ($bank->currency_code ?? ''),
                    'is_active' => (bool) $bank->is_active,
                    'show_on_documents' => (bool) $bank->show_on_documents,
                    'sort_order' => (int) $bank->sort_order,
                    'logo_url' => $this->storageUrl($bank->logo_path ?? null),
                    'logo_data' => $this->dataUri($bank->logo_path ?? null),
                ];
            })
            ->values()
            ->all();
    }

    public function reportData(): array
    {
        $setting = $this->current();
        $logoPath = $setting->logo_path ?? null;
        $qrPath = $setting->qr_path ?? null;

        return [
            'name' => (string) ($setting->company_name ?? ''),
            'company_name' => (string) ($setting->company_name ?? ''),
            'tagline' => (string) ($setting->tagline ?? ''),
            'address' => (string) ($setting->address ?? ''),
            'phone' => (string) ($setting->phone ?? ''),
            'mobile' => (string) ($setting->mobile ?? ''),
            'email' => (string) ($setting->email ?? ''),
            'website' => (string) ($setting->website ?? ''),
            'govt_license' => (string) ($setting->govt_license ?? ''),
            'ntn' => (string) ($setting->ntn ?? ''),
            'document_notes' => (string) ($setting->document_notes ?? ''),
            'document_footer' => (string) ($setting->document_footer ?? ''),
            'base_currency_code' => (string) ($setting->base_currency_code ?? 'PKR'),
            'decimal_places' => (int) ($setting->decimal_places ?? 2),
            'paper_size' => (string) ($setting->paper_size ?? 'A4'),
            'print_orientation' => (string) ($setting->print_orientation ?? 'portrait'),
            'show_company_header' => (bool) ($setting->show_company_header ?? true),
            'show_address' => (bool) ($setting->show_address ?? true),
            'show_phone' => (bool) ($setting->show_phone ?? true),
            'show_email' => (bool) ($setting->show_email ?? true),
            'show_website' => (bool) ($setting->show_website ?? true),
            'show_govt_license' => (bool) ($setting->show_govt_license ?? true),
            'show_ntn' => (bool) ($setting->show_ntn ?? true),
            'show_qr' => (bool) ($setting->show_qr ?? true),
            'banks' => $this->bankData(),
            'logo_path' => $logoPath,
            'qr_path' => $qrPath,
            'logo_url' => $this->storageUrl($logoPath),
            'qr_url' => $this->storageUrl($qrPath),
            'logo_data' => $this->dataUri($logoPath),
            'qr_data' => $this->dataUri($qrPath),
        ];
    }

    private function storageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (
            str_starts_with($path, 'http://')
            || str_starts_with($path, 'https://')
            || str_starts_with($path, 'data:')
        ) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }

    private function dataUri(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'data:')) {
            return $path;
        }

        if (
            str_starts_with($path, 'http://')
            || str_starts_with($path, 'https://')
        ) {
            return null;
        }

        $disk = Storage::disk('public');

        if (! $disk->exists($path)) {
            return null;
        }

        $fullPath = $disk->path($path);

        if (! is_file($fullPath)) {
            return null;
        }

        $mime = mime_content_type($fullPath) ?: 'image/png';
        $contents = file_get_contents($fullPath);

        if ($contents === false) {
            return null;
        }

        return 'data:' . $mime . ';base64,' . base64_encode($contents);
    }
}
