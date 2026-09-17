<?php
$users = DB::connection("legacy")->table("Users")->get();

$ignore = [
    "Username",
    "User Description",
    "Password",
    "CreateDate",
    "DisableDate",
    "Branch",
    "Department",
    "Designation",
    "Email",
    "MobileNo",
];

foreach ($users as $user) {
    echo PHP_EOL . "================ {$user->Username} ================" . PHP_EOL;

    foreach (get_object_vars($user) as $field => $value) {
        if (in_array($field, $ignore, true)) {
            continue;
        }

        if ((string) $value === "1") {
            echo $field . PHP_EOL;
        }
    }
}
