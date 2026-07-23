<?php
echo json_encode(\App\Models\Invoice::limit(2)->get());
echo "\n";
