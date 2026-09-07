<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$appPath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') . '/';
session_name('rotacion_farmacia_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => $appPath,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

$dataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
$planFile = $dataDir . DIRECTORY_SEPARATOR . 'plan.json';
$authFile = $dataDir . DIRECTORY_SEPARATOR . 'auth.json';
$backupDir = $dataDir . DIRECTORY_SEPARATOR . 'backups';

function respond(array $payload, int $status = 200) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array {
    $raw = file_get_contents('php://input');
    $value = json_decode($raw ?: '{}', true);
    return is_array($value) ? $value : [];
}

function readJson(string $path): ?array {
    if (!is_file($path)) return null;
    $value = json_decode((string) file_get_contents($path), true);
    return is_array($value) ? $value : null;
}

function writeJson(string $path, array $value): bool {
    $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json !== false && file_put_contents($path, $json . PHP_EOL, LOCK_EX) !== false;
}

function requireAdmin(): void {
    if (empty($_SESSION['farmacia_admin'])) respond(['ok' => false, 'error' => 'Sesión no autorizada'], 401);
}

function validPlan($data): bool {
    return is_array($data)
        && isset($data['personas'], $data['areas'], $data['periodos'], $data['asignaciones'], $data['reglas'])
        && is_array($data['personas']) && is_array($data['areas']) && is_array($data['periodos'])
        && is_array($data['asignaciones']) && is_array($data['reglas']);
}

if (!is_dir($dataDir) && !mkdir($dataDir, 0770, true)) respond(['ok' => false, 'error' => 'No se pudo crear la carpeta de datos'], 500);
$action = $_GET['action'] ?? 'data';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($action === 'data' && $method === 'GET') {
    respond(['ok' => true, 'authenticated' => !empty($_SESSION['farmacia_admin']), 'data' => readJson($planFile)]);
}

if ($action === 'login' && $method === 'POST') {
    $auth = readJson($authFile);
    if (!$auth || !isset($auth['salt'], $auth['hash'], $auth['iterations'])) respond(['ok' => false, 'error' => 'Falta configurar la contraseña del sistema'], 500);
    $input = body();
    $password = (string) ($input['password'] ?? '');
    $candidate = hash_pbkdf2('sha256', $password, (string) $auth['salt'], (int) $auth['iterations'], 64, false);
    if (!hash_equals((string) $auth['hash'], $candidate)) {
        usleep(350000);
        respond(['ok' => false, 'error' => 'Contraseña incorrecta'], 401);
    }
    session_regenerate_id(true);
    $_SESSION['farmacia_admin'] = true;
    respond(['ok' => true]);
}

if ($action === 'logout' && $method === 'POST') {
    $_SESSION = [];
    session_destroy();
    respond(['ok' => true]);
}

if ($action === 'save' && $method === 'POST') {
    requireAdmin();
    $input = body();
    $data = $input['data'] ?? null;
    if (!validPlan($data)) respond(['ok' => false, 'error' => 'Los datos recibidos no son válidos'], 422);
    if (is_file($planFile)) {
        if (!is_dir($backupDir)) mkdir($backupDir, 0770, true);
        @copy($planFile, $backupDir . DIRECTORY_SEPARATOR . 'plan-' . date('Ymd-His') . '.json');
        $backups = glob($backupDir . DIRECTORY_SEPARATOR . 'plan-*.json') ?: [];
        rsort($backups);
        foreach (array_slice($backups, 30) as $old) @unlink($old);
    }
    $data['updatedAt'] = date(DATE_ATOM);
    if (!writeJson($planFile, $data)) respond(['ok' => false, 'error' => 'No se pudo guardar. Revise los permisos de la carpeta data'], 500);
    respond(['ok' => true, 'updatedAt' => $data['updatedAt']]);
}

if ($action === 'change-password' && $method === 'POST') {
    requireAdmin();
    $auth = readJson($authFile);
    $input = body();
    $current = (string) ($input['currentPassword'] ?? '');
    $new = (string) ($input['newPassword'] ?? '');
    if (!$auth) respond(['ok' => false, 'error' => 'Configuración de acceso no disponible'], 500);
    $candidate = hash_pbkdf2('sha256', $current, (string) $auth['salt'], (int) $auth['iterations'], 64, false);
    if (!hash_equals((string) $auth['hash'], $candidate)) respond(['ok' => false, 'error' => 'La contraseña actual no es correcta'], 401);
    if (strlen($new) < 8) respond(['ok' => false, 'error' => 'La nueva contraseña debe tener al menos 8 caracteres'], 422);
    $salt = bin2hex(random_bytes(16));
    $iterations = 120000;
    $newAuth = ['salt' => $salt, 'hash' => hash_pbkdf2('sha256', $new, $salt, $iterations, 64, false), 'iterations' => $iterations];
    if (!writeJson($authFile, $newAuth)) respond(['ok' => false, 'error' => 'No se pudo actualizar la contraseña'], 500);
    respond(['ok' => true]);
}

respond(['ok' => false, 'error' => 'Operación no disponible'], 404);
