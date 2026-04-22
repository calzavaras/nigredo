<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode nicht erlaubt.']);
    exit;
}

// CSRF validation (double-submit cookie pattern)
$csrfPost   = $_POST['_csrf']   ?? '';
$csrfCookie = $_COOKIE['_csrf'] ?? '';
if (empty($csrfPost) || empty($csrfCookie) || !hash_equals($csrfCookie, $csrfPost)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Ungültige Anfrage.']);
    exit;
}

// IP-based rate limiting (file-based, hashed IP — no raw IP stored)
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash   = hash('sha256', $ip);
$rlFile   = sys_get_temp_dir() . '/nigredo_rl_' . $ipHash;
$now      = time();
$cooldown = 60;

if (file_exists($rlFile)) {
    $lastTime = (int) file_get_contents($rlFile);
    if ($now - $lastTime < $cooldown) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Bitte warte kurz vor dem nächsten Versuch.']);
        exit;
    }
}

// Session-based rate limiting as additional layer
session_start();
if (!isset($_SESSION['last_contact'])) {
    $_SESSION['last_contact'] = 0;
}
if ($now - $_SESSION['last_contact'] < $cooldown) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Bitte warte kurz vor dem nächsten Versuch.']);
    exit;
}

// Honeypot: bots fill hidden fields — silent exit, no feedback to bot
if (!empty($_POST['website'])) {
    http_response_code(200);
    exit;
}

// Sanitize inputs
$name    = strip_tags(trim($_POST['name']    ?? ''));
$email   = trim($_POST['email']   ?? '');
$subject = strip_tags(trim($_POST['subject'] ?? ''));
$message = strip_tags(trim($_POST['message'] ?? ''));

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte alle Pflichtfelder ausfüllen.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ungültige E-Mail-Adresse.']);
    exit;
}

// Length limits
if (strlen($name) > 120 || strlen($message) > 6000 || strlen($subject) > 250) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Eingaben zu lang.']);
    exit;
}

$emailTo    = 'calzavara3830@gmail.com';
$msgSubject = !empty($subject) ? $subject : 'Anfrage via Website';

$body  = "Name:    {$name}\n";
$body .= "E-Mail:  {$email}\n";
$body .= "\nNachricht:\n{$message}\n";
$body .= "\n---\nGesendet via www.nigredo.ch Kontaktformular";

// Strip newlines from header fields to prevent header injection
$emailSafe = preg_replace('/[\r\n\t]/', '', $email);
$nameSafe  = preg_replace('/[\r\n\t]/', '', $name);

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "From: Nigredo Website <noreply@nigredo.ch>\r\n";
$headers .= "Reply-To: =?UTF-8?B?" . base64_encode($nameSafe) . "?= <{$emailSafe}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($msgSubject) . '?=';

if (mail($emailTo, $encodedSubject, $body, $headers)) {
    $_SESSION['last_contact'] = $now;
    file_put_contents($rlFile, $now);
    echo json_encode([
        'success' => true,
        'message' => 'Deine Nachricht ist angekommen! Ich melde mich persönlich.',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Fehler beim Senden. Bitte versuche es erneut.',
    ]);
}
