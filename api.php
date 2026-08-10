<?php
/**
 * ZERON TEMP MAIL — PHP proxy for shared hosting / cPanel / Hostinger
 * --------------------------------------------------------------------
 * Works anywhere PHP 7+ with curl (or allow_url_fopen) runs — the same
 * hosts that can't run Node. Drop the whole repo into public_html and
 * the frontend automatically detects this file (POST /api fails ->
 * tries POST /api.php).
 *
 * CONFIG — EDIT THIS SECTION
 *   $API_KEY  -> put your key_xxxx here directly,
 *                or leave empty and set env ZERON_API_KEY (rare on cPanel).
 * --------------------------------------------------------------------
 */

$API_BASE = getenv("ZERON_API_BASE") ?: "https://dev-zeron-temp-gmail-api-v1.vercel.app";
$API_KEY  = getenv("ZERON_API_KEY") ?: "";   // <-- or paste key_xxxx here

/* ---------------------------------------------------------------- */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

$raw  = file_get_contents("php://input");
$body = json_decode($raw, true);
if (!is_array($body)) $body = [];

$path   = trim(isset($body["path"]) ? $body["path"] : "", "/");
$method = strtoupper(isset($body["method"]) ? $body["method"] : "GET");
$query  = (isset($body["query"]) && is_array($body["query"])) ? $body["query"] : [];
$data   = isset($body["data"]) ? $body["data"] : null;

if ($path === "") {
    respond(400, ["status" => false, "message" => 'Missing "path", e.g. {"path":"generate/mixed"}']);
}
if ($API_KEY === "") {
    respond(500, ["status" => false, "message" => "No API key set. Edit \$API_KEY at the top of api.php."]);
}

$filtered = array_filter($query, function ($v) {
    return $v !== null && $v !== false && $v !== "";
});
$qs  = http_build_query($filtered);
$url = rtrim($API_BASE, "/") . "/api/" . $path . ($qs ? "?" . $qs : "");

$result = request($url, $method, $API_KEY, $data);
if ($result === null) {
    respond(502, ["status" => false, "message" => "Upstream request failed (PHP needs curl or allow_url_fopen)."]);
}
list($code, $headers, $respBody) = $result;

http_response_code($code);
foreach ($headers as $name => $value) {
    if (strcasecmp($name, "Content-Type") !== 0) header($name . ": " . $value);
}
header("Content-Type: " . (isset($headers["Content-Type"]) ? $headers["Content-Type"] : "application/json"));
echo $respBody;

/* ---------- helpers ---------- */

function respond($code, $obj)
{
    http_response_code($code);
    header("Content-Type: application/json");
    echo json_encode($obj);
    exit;
}

function request($url, $method, $key, $data)
{
    if ($method === "POST" && $data !== null) {
        $payload = json_encode($data);
    } else {
        $payload = null;
    }

    if (function_exists("curl_init")) {
        $ch = curl_init($url);
        $headers = ["Authorization: Bearer " . $key, "Accept: application/json"];
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT        => 30,
        ];
        if ($payload !== null) {
            $opts[CURLOPT_POST] = true;
            $opts[CURLOPT_POSTFIELDS] = $payload;
            $headers[] = "Content-Type: application/json";
            $opts[CURLOPT_HTTPHEADER] = $headers;
        }
        curl_setopt_array($ch, $opts);
        $respBody = curl_exec($ch);
        if ($respBody === false) {
            curl_close($ch);
            return null;
        }
        $code    = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ctype   = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        if (PHP_VERSION_ID < 80000) curl_close($ch); // no-op in PHP 8+
        return [$code, ["Content-Type" => $ctype], $respBody];
    }

    if (ini_get("allow_url_fopen")) {
        $ctxOpts = [
            "http" => [
                "method"        => $payload !== null ? "POST" : $method,
                "header"        => "Authorization: Bearer " . $key . "\r\nAccept: application/json\r\n" . ($payload !== null ? "Content-Type: application/json\r\n" : ""),
                "content"       => $payload !== null ? $payload : "",
                "ignore_errors" => true,
                "timeout"       => 30,
            ],
            "ssl"  => ["verify_peer" => true, "verify_peer_name" => true],
        ];
        $ctx = stream_context_create($ctxOpts);
        $respBody = @file_get_contents($url, false, $ctx);
        if ($respBody === false) return null;
        $code = 200;
        preg_match('/HTTP\/\d(?:\.\d)?\s+(\d{3})/', $http_response_header[0] ?? "", $m);
        if ($m) $code = (int) $m[1];
        return [$code, ["Content-Type" => ""], $respBody];
    }

    return null;
}