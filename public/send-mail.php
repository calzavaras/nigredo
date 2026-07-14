<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Methode nicht erlaubt.']);
}

// CSRF validation (double-submit cookie pattern)
$csrfPost   = $_POST['_csrf']   ?? '';
$csrfCookie = $_COOKIE['_csrf'] ?? '';
if (empty($csrfPost) || empty($csrfCookie) || !hash_equals($csrfCookie, $csrfPost)) {
    respond(403, ['success' => false, 'message' => 'Ungültige Anfrage.']);
}

// IP-based rate limiting (file-based, hashed IP; no raw IP stored)
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ipHash   = hash('sha256', $ip);
$rlFile   = sys_get_temp_dir() . '/nigredo_rl_' . $ipHash;
$now      = time();
$cooldown = 60;
$rlHandle = fopen($rlFile, 'c+');

function closeRateLimitHandle($handle): void
{
    if (!$handle) {
        return;
    }

    flock($handle, LOCK_UN);
    fclose($handle);
}

if ($rlHandle && flock($rlHandle, LOCK_EX)) {
    rewind($rlHandle);
    $lastTime = (int) stream_get_contents($rlHandle);
    if ($now - $lastTime < $cooldown) {
        closeRateLimitHandle($rlHandle);
        respond(429, ['success' => false, 'message' => 'Bitte warte kurz vor dem nächsten Versuch.']);
    }

    ftruncate($rlHandle, 0);
    rewind($rlHandle);
    fwrite($rlHandle, (string) $now);
    fflush($rlHandle);
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
if (!isset($_SESSION['last_contact_attempt'])) {
    $_SESSION['last_contact_attempt'] = 0;
}
if ($now - $_SESSION['last_contact_attempt'] < $cooldown) {
    closeRateLimitHandle($rlHandle);
    respond(429, ['success' => false, 'message' => 'Bitte warte kurz vor dem nächsten Versuch.']);
}
$_SESSION['last_contact_attempt'] = $now;

// Honeypot: bots fill hidden fields; silent exit, no feedback to bot
if (!empty($_POST['website'])) {
    closeRateLimitHandle($rlHandle);
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
    closeRateLimitHandle($rlHandle);
    respond(400, ['success' => false, 'message' => 'Bitte alle Pflichtfelder ausfüllen.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    closeRateLimitHandle($rlHandle);
    respond(400, ['success' => false, 'message' => 'Ungültige E-Mail-Adresse.']);
}

if (!empty($phone) && !preg_match('/^[0-9+() .-]{7,32}$/', $phone)) {
    closeRateLimitHandle($rlHandle);
    respond(400, ['success' => false, 'message' => 'Ungültige Telefonnummer.']);
}

// Length limits
if (strlen($name) > 120 || strlen($phone) > 32 || strlen($message) > 6000 || strlen($subject) > 250) {
    closeRateLimitHandle($rlHandle);
    respond(400, ['success' => false, 'message' => 'Eingaben zu lang.']);
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
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
      :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
      }

      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #050505 !important;
        background-color: #050505 !important;
        color: #f5f5f7 !important;
      }

      body,
      table,
      td,
      div,
      p,
      a,
      span {
        font-family: Arial, sans-serif !important;
      }

      .nigredo-shell,
      .nigredo-shell td,
      .nigredo-card,
      .nigredo-card td {
        background: #050505 !important;
        background-color: #050505 !important;
      }

      .nigredo-panel,
      .nigredo-panel td {
        background: #0b0b0d !important;
        background-color: #0b0b0d !important;
      }

      .nigredo-meta,
      .nigredo-meta td {
        background: #111115 !important;
        background-color: #111115 !important;
      }

      .nigredo-message,
      .nigredo-message td {
        background: #0f1013 !important;
        background-color: #0f1013 !important;
      }

      @media (prefers-color-scheme: dark) {
        html,
        body,
        .nigredo-shell,
        .nigredo-shell td,
        .nigredo-card,
        .nigredo-card td {
          background: #050505 !important;
          background-color: #050505 !important;
          color: #f5f5f7 !important;
        }

        .nigredo-panel,
        .nigredo-panel td {
          background: #0b0b0d !important;
          background-color: #0b0b0d !important;
        }

        .nigredo-meta,
        .nigredo-meta td {
          background: #111115 !important;
          background-color: #111115 !important;
        }

        .nigredo-message,
        .nigredo-message td {
          background: #0f1013 !important;
          background-color: #0f1013 !important;
        }
      }
    </style>
    <title>{$subjectHtml}</title>
  </head>
  <body bgcolor="#050505" style="margin:0; padding:0; background:#050505 !important; background-color:#050505 !important; color:#f5f5f7; font-family:Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Neue Kontaktanfrage von {$nameHtml} via Nigredo.
    </div>
    <table role="presentation" class="nigredo-shell" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#050505" style="width:100%; background:#050505 !important; background-color:#050505 !important; margin:0; padding:0;">
      <tr>
        <td align="center" valign="top" bgcolor="#050505" style="padding:32px 14px; background:#050505 !important; background-color:#050505 !important;">
          <table role="presentation" class="nigredo-card" width="680" cellspacing="0" cellpadding="0" border="0" bgcolor="#050505" style="width:100%; max-width:680px; background:#050505 !important; background-color:#050505 !important;">
            <tr>
              <td bgcolor="#050505" style="padding:0; background:#050505 !important; background-color:#050505 !important;">
                <table role="presentation" class="nigredo-panel" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b0b0d" style="width:100%; background:#0b0b0d !important; background-color:#0b0b0d !important; border:1px solid #23232a;">
            <tr>
              <td bgcolor="#ff749e" style="height:4px; background-color:#ff749e; background-image:linear-gradient(90deg,#FF749E 0%,#FF3DBB 50%,#8B4DFF 100%); line-height:4px; font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td bgcolor="#0b0b0d" style="padding:38px 32px 22px; background:#0b0b0d !important; background-color:#0b0b0d !important;">
                <div style="font-size:11px; line-height:1.4; font-weight:700; letter-spacing:1.9px; text-transform:uppercase; color:#FFDA72; margin-bottom:14px;">Neue Anfrage via Nigredo</div>
                <div style="margin:0 0 14px; color:#ffffff; font-size:30px; line-height:1.14; font-weight:700;">{$subjectHtml}</div>
                <div style="color:#b3b3bc; font-size:15px; line-height:1.65;">Diese Nachricht wurde über das Kontaktformular auf <span style="color:#ffffff;">www.nigredo.ch</span> gesendet.</div>
              </td>
            </tr>
            <tr>
              <td bgcolor="#0b0b0d" style="padding:0 32px 18px; background:#0b0b0d !important; background-color:#0b0b0d !important;">
                <table role="presentation" class="nigredo-meta" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#111115" style="width:100%; background:#111115 !important; background-color:#111115 !important; border:1px solid #23232a;">
                  <tr>
                    <td bgcolor="#111115" style="width:118px; padding:16px 18px; color:#8f8f98; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; vertical-align:top; border-bottom:1px solid #23232a;">Name</td>
                    <td bgcolor="#111115" style="padding:16px 18px; color:#ffffff; font-size:15px; font-weight:600; border-bottom:1px solid #23232a;">{$nameHtml}</td>
                  </tr>
                  <tr>
                    <td bgcolor="#111115" style="width:118px; padding:16px 18px; color:#8f8f98; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; vertical-align:top; border-bottom:1px solid #23232a;">E-Mail</td>
                    <td bgcolor="#111115" style="padding:16px 18px; color:#ffffff; font-size:15px; font-weight:600; border-bottom:1px solid #23232a;"><a href="mailto:{$emailHtml}" style="color:#7fdfff; text-decoration:none;">{$emailHtml}</a></td>
                  </tr>
                  <tr>
                    <td bgcolor="#111115" style="width:118px; padding:16px 18px; color:#8f8f98; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; vertical-align:top;">Telefon</td>
                    <td bgcolor="#111115" style="padding:16px 18px; color:#ffffff; font-size:15px; font-weight:600;">{$phoneHtml}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#0b0b0d" style="padding:0 32px 34px; background:#0b0b0d !important; background-color:#0b0b0d !important;">
                <table role="presentation" class="nigredo-message" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0f1013" style="width:100%; background:#0f1013 !important; background-color:#0f1013 !important; border:1px solid #23232a;">
                  <tr>
                    <td bgcolor="#0f1013" style="padding:18px 20px 12px; background:#0f1013 !important; background-color:#0f1013 !important; color:#8f8f98; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; border-bottom:1px solid #23232a;">Nachricht</td>
                  </tr>
                  <tr>
                    <td bgcolor="#0f1013" style="padding:18px 20px 20px; background:#0f1013 !important; background-color:#0f1013 !important; color:#e8e8ec; font-size:16px; line-height:1.75;">{$messageHtml}</td>
                  </tr>
                </table>
              </td>
            </tr>
                </table>
              </td>
            </tr>
          </table>
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" bgcolor="#050505" style="width:100%; max-width:680px; background:#050505 !important; background-color:#050505 !important;">
            <tr>
              <td bgcolor="#050505" style="padding:18px 6px 0; background:#050505 !important; background-color:#050505 !important; color:#767680; font-size:12px; line-height:1.55; text-align:left;">Antworten auf diese E-Mail gehen direkt an {$nameHtml}. Gesendet via Nigredo Kontaktformular.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
HTML;

// Strip newlines from header fields to prevent header injection
$emailSafe = preg_replace('/[\r\n\t]/', '', $email);
$nameSafe  = preg_replace('/[\r\n\t]/', '', $name);

$boundary = bin2hex(random_bytes(16));

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
$headers .= "From: Nigredo Website <noreply@nigredo.ch>\r\n";
$headers .= "Reply-To: =?UTF-8?B?" . base64_encode($nameSafe) . "?= <{$emailSafe}>\r\n";
$headers .= "X-Mailer: Nigredo Contact\r\n";

$encodedSubject = '=?UTF-8?B?' . base64_encode($msgSubject) . '?=';

$multipartBody  = "--{$boundary}\r\n";
$multipartBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
$multipartBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$multipartBody .= $plainBody . "\r\n";
$multipartBody .= "--{$boundary}\r\n";
$multipartBody .= "Content-Type: text/html; charset=UTF-8\r\n";
$multipartBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$multipartBody .= $body . "\r\n";
$multipartBody .= "--{$boundary}--";

if (mail($emailTo, $encodedSubject, $multipartBody, $headers)) {
    closeRateLimitHandle($rlHandle);
    echo json_encode([
        'success' => true,
        'message' => 'Deine Nachricht ist angekommen! Ich melde mich persönlich.',
    ]);
} else {
    closeRateLimitHandle($rlHandle);
    respond(500, [
        'success' => false,
        'message' => 'Fehler beim Senden. Bitte versuche es erneut.',
    ]);
}
