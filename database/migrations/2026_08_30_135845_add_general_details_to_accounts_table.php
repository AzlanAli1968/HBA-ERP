<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * This migration intentionally uses MariaDB's
         * ADD COLUMN IF NOT EXISTS because the previous
         * attempt partially modified the accounts table
         * before the migration was recorded.
         *
         * This makes the migration safe to run again.
         */

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `client_type`
            VARCHAR(50) NULL AFTER `name`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `care_of_employee`
            VARCHAR(150) NULL AFTER `city_category`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `contact`
            VARCHAR(150) NULL AFTER `care_of_employee`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `designation`
            VARCHAR(150) NULL AFTER `contact`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `mobile`
            VARCHAR(50) NULL AFTER `designation`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `contact_2`
            VARCHAR(150) NULL AFTER `mobile`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `designation_2`
            VARCHAR(150) NULL AFTER `contact_2`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `company`
            VARCHAR(200) NULL AFTER `designation_2`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `business_phone`
            VARCHAR(50) NULL AFTER `company`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `home_phone`
            VARCHAR(50) NULL AFTER `business_phone`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `fax`
            VARCHAR(50) NULL AFTER `home_phone`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `email`
            VARCHAR(190) NULL AFTER `fax`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `address`
            TEXT NULL AFTER `email`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `country`
            VARCHAR(100) NULL AFTER `address`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `website`
            VARCHAR(255) NULL AFTER `country`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `credit_limit`
            DECIMAL(18,2) NOT NULL DEFAULT 0 AFTER `website`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `credit_days`
            INT UNSIGNED NOT NULL DEFAULT 0 AFTER `credit_limit`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `bank_name`
            VARCHAR(150) NULL AFTER `credit_days`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `bank_branch`
            VARCHAR(150) NULL AFTER `bank_name`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `bank_account_number`
            VARCHAR(100) NULL AFTER `bank_branch`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `tax_type`
            VARCHAR(30) NULL AFTER `bank_account_number`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `tax_number`
            VARCHAR(100) NULL AFTER `tax_type`
        ");

        DB::statement("
            ALTER TABLE `accounts`
            ADD COLUMN IF NOT EXISTS `strn`
            VARCHAR(100) NULL AFTER `tax_number`
        ");
    }

    public function down(): void
    {
        /*
         * We intentionally do not remove these columns automatically.
         *
         * The database may already contain data entered into these
         * fields. Removing them during a rollback could destroy data.
         *
         * If we ever need to remove the migration, we will handle
         * that explicitly and safely.
         */
    }
};