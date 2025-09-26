<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// JSON 文件路径
$jsonFile = 'counter.json';

// 获取当前日期
$currentDate = date('Y-m-d');

// 初始化数据结构
$defaultData = [
    'total_count' => 0,
    'daily_count' => 0,
    'last_date' => $currentDate
];

// 读取现有数据
if (file_exists($jsonFile)) {
    $data = json_decode(file_get_contents($jsonFile), true);
    if (!$data) {
        $data = $defaultData;
    }
} else {
    $data = $defaultData;
}

// 检查日期是否一致，如果不一致则重置今日计数
if ($data['last_date'] !== $currentDate) {
    $data['daily_count'] = 0;
    $data['last_date'] = $currentDate;
}

// 增加计数
$data['total_count']++;
$data['daily_count']++;

// 保存数据
file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT));

// 返回当前数据
echo json_encode([
    'success' => true,
    'total_count' => $data['total_count'],
    'daily_count' => $data['daily_count'],
    'current_date' => $currentDate
]);
?>