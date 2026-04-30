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
$rlHandle = fopen($rlFile, 'c+');

if ($rlHandle && flock($rlHandle, LOCK_EX)) {
    rewind($rlHandle);
    $lastTime = (int) stream_get_contents($rlHandle);
    if ($now - $lastTime < $cooldown) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Bitte warte kurz vor dem nächsten Versuch.']);
        exit;
    }
}

// Session-based rate limiting as additional layer
ini_set('session.use_strict_mode', '1');
session_set_cookie_params([
    'httponly' => true,
    'secure' => (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
    ),
    'samesite' => 'Strict',
    'path' => '/',
]);
session_start();
if (!isset($_SESSION['last_contact'])) {
    $_SESSION['last_contact'] = 0;
}
if ($now - $_SESSION['last_contact'] < $cooldown) {
    if ($rlHandle) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
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
$phone   = strip_tags(trim($_POST['phone']   ?? ''));
$subject = strip_tags(trim($_POST['subject'] ?? ''));
$message = strip_tags(trim($_POST['message'] ?? ''));

// Validate required fields
if (empty($name) || empty($email) || empty($message)) {
    if ($rlHandle) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte alle Pflichtfelder ausfüllen.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    if ($rlHandle) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ungültige E-Mail-Adresse.']);
    exit;
}

if (!empty($phone) && !preg_match('/^[0-9+() .-]{7,32}$/', $phone)) {
    if ($rlHandle) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ungültige Telefonnummer.']);
    exit;
}

// Length limits
if (strlen($name) > 120 || strlen($phone) > 32 || strlen($message) > 6000 || strlen($subject) > 250) {
    if ($rlHandle) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Eingaben zu lang.']);
    exit;
}

$emailTo    = 'calzavara3830@gmail.com';
$msgSubject = !empty($subject) ? $subject : 'Anfrage via Website';

$escape = static function ($value) {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$plainBody  = "Name:    {$name}\n";
$plainBody .= "E-Mail:  {$email}\n";
$plainBody .= !empty($phone) ? "Telefon: {$phone}\n" : "Telefon: -\n";
$plainBody .= "\nNachricht:\n{$message}\n";
$plainBody .= "\n---\nGesendet via www.nigredo.ch Kontaktformular";

$messageHtml = nl2br($escape($message));
$nameHtml    = $escape($name);
$emailHtml   = $escape($email);
$phoneHtml   = !empty($phone) ? $escape($phone) : '-';
$subjectHtml = $escape($msgSubject);

$body = <<<HTML
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subjectHtml}</title>
  </head>
  <body style="margin:0; padding:0; background:#050505; color:#f5f5f7; font-family:Inter, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050505; padding:28px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#0a0a0c; border:1px solid rgba(255,255,255,0.12); border-radius:16px; overflow:hidden;">
            <tr>
              <td style="height:3px; background:linear-gradient(90deg,#00D2FF,#A64DFF,#FF4D80); line-height:3px; font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:34px 32px 12px;">
                <div style="font-size:11px; line-height:1.4; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; color:#00D2FF; margin-bottom:12px;">Neue Anfrage via Nigredo</div>
                <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.18; letter-spacing:-0.02em;">{$subjectHtml}</h1>
                <p style="margin:14px 0 0; color:rgba(255,255,255,0.58); font-size:15px; line-height:1.6;">Diese Nachricht wurde über das Kontaktformular auf www.nigredo.ch gesendet.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 4px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate; border-spacing:0 10px;">
                  <tr>
                    <td style="width:112px; color:rgba(255,255,255,0.44); font-size:13px; vertical-align:top;">Name</td>
                    <td style="color:#ffffff; font-size:15px; font-weight:600;">{$nameHtml}</td>
                  </tr>
                  <tr>
                    <td style="width:112px; color:rgba(255,255,255,0.44); font-size:13px; vertical-align:top;">E-Mail</td>
                    <td style="color:#ffffff; font-size:15px; font-weight:600;"><a href="mailto:{$emailHtml}" style="color:#00D2FF; text-decoration:none;">{$emailHtml}</a></td>
                  </tr>
                  <tr>
                    <td style="width:112px; color:rgba(255,255,255,0.44); font-size:13px; vertical-align:top;">Telefon</td>
                    <td style="color:#ffffff; font-size:15px; font-weight:600;">{$phoneHtml}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 34px;">
                <div style="height:1px; background:linear-gradient(90deg,rgba(0,210,255,0.28),rgba(166,77,255,0.2),rgba(255,77,128,0.12),transparent); margin-bottom:22px;"></div>
                <div style="color:rgba(255,255,255,0.44); font-size:13px; margin-bottom:10px;">Nachricht</div>
                <div style="color:rgba(255,255,255,0.84); font-size:16px; line-height:1.7;">{$messageHtml}</div>
              </td>
            </tr>
          </table>
          <div style="max-width:640px; color:rgba(255,255,255,0.35); font-size:12px; line-height:1.5; padding:16px 4px 0; text-align:left;">Antworten auf diese E-Mail gehen direkt an {$nameHtml}.</div>
        </td>
      </tr>
    </table>
  </body>
</html>
HTML;

// Strip newlines from header fields to prevent header injection
$emailSafe = preg_replace('/[\r\n\t]/', '', $email);
$nameSafe  = preg_replace('/[\r\n\t]/', '', $name);

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "From: Nigredo Website <noreply@nigredo.ch>\r\n";
$headers .= "Reply-To: =?UTF-8?B?" . base64_encode($nameSafe) . "?= <{$emailSafe}>\r\n";
$headers .= "X-Mailer: Nigredo Contact\r\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($msgSubject) . '?=';

if (mail($emailTo, $encodedSubject, $body, $headers)) {
    $_SESSION['last_contact'] = $now;
    if ($rlHandle) {
        ftruncate($rlHandle, 0);
        rewind($rlHandle);
        fwrite($rlHandle, (string) $now);
        fflush($rlHandle);
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
    echo json_encode([
        'success' => true,
        'message' => 'Deine Nachricht ist angekommen! Ich melde mich persönlich.',
    ]);
} else {
    if ($rlHandle) {
        flock($rlHandle, LOCK_UN);
        fclose($rlHandle);
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Fehler beim Senden. Bitte versuche es erneut.',
    ]);
}
