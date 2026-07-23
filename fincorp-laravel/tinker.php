<?php
echo json_encode(\App\Models\Document::limit(2)->get());
echo "\n";
echo json_encode(\App\Models\EsgMetric::limit(2)->get());
