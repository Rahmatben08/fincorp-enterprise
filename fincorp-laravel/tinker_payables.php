<?php
echo json_encode(\App\Models\VendorInvoice::limit(2)->get());
echo "\n";
