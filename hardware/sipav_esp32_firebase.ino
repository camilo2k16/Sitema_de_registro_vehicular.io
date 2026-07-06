/* ════════════════════════════════════════════════════════════════════
   SIPAV-UFPS · Firmware ESP32 + RC522  (Firebase Realtime Database REST)
   ────────────────────────────────────────────────────────────────────
   Qué hace en cada lectura de tarjeta:
     1. Lee el UID de la tarjeta.
     2. Consulta  GET  /users/{UIDKEY}.json   en Firebase.
     3a. Si la tarjeta NO está registrada → escribe /enroll (para que la
         página "Registrar usuario" capture ese UID y lo asigne).
     3b. Si SÍ está registrada → decide permitido/denegado, registra el
         acceso en  POST /logs.json  y abre la barrera si está autorizado.

   ── Dónde se envía el valor del RFID ──
      A tu base de Firebase (la misma que usa la página web).
      No necesitas servidor propio.

   ── Dónde se lee si se autoriza la entrada ──
      En la respuesta del GET /users/{UIDKEY}.json:
        • null            → no registrada
        • {"blocked":true}→ denegado
        • status != Activo→ denegado
        • si no           → PERMITIDO → abre la barrera

   Librerías (Gestor de librerías del IDE de Arduino):
     • "MFRC522" by GithubCommunity
     • "ArduinoJson" by Benoit Blanchon
   Placa: "ESP32 Dev Module"
   ════════════════════════════════════════════════════════════════════ */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ───────────── CONFIGURA ESTO ─────────────
const char* WIFI_SSID     = "TU_WIFI";
const char* WIFI_PASSWORD = "TU_CLAVE_WIFI";

// URL de tu Realtime Database SIN barra final.
// La ves en la consola de Firebase → Realtime Database (arriba).
// Ej: https://sipav-ufps-default-rtdb.firebaseio.com
const char* DB_URL        = "https://sipav-ufps-default-rtdb.firebaseio.com";

// Pines de la barrera / señalización
#define RELAY_PIN  26   // relé que activa el motor / electroimán de la barrera
#define LED_OK     14   // LED verde  (permitido)
#define LED_FAIL   27   // LED rojo   (denegado / no registrada)
#define BUZZER     25   // opcional (-1 si no usas)

const int  OPEN_TIME_MS = 4000;   // tiempo que la barrera queda abierta
const bool RELAY_ACTIVE_HIGH = true;

// Pines RC522 (SPI)
#define SS_PIN   5
#define RST_PIN  22
// (SCK=18, MOSI=23, MISO=19 son fijos del bus SPI del ESP32)

MFRC522 rfid(SS_PIN, RST_PIN);

// ───────────── SETUP ─────────────
void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT); relay(false);
  pinMode(LED_OK, OUTPUT);    digitalWrite(LED_OK, LOW);
  pinMode(LED_FAIL, OUTPUT);  digitalWrite(LED_FAIL, LOW);
  if (BUZZER >= 0) { pinMode(BUZZER, OUTPUT); digitalWrite(BUZZER, LOW); }

  SPI.begin();
  rfid.PCD_Init();
  Serial.println("\nLector RC522 listo.");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\n✓ WiFi OK. IP: " + WiFi.localIP().toString());

  // Hora real (NTP) para que los registros tengan fecha/hora correcta.
  // GMT-5 (Colombia) = -18000 segundos.
  configTime(-18000, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Sincronizando hora");
  time_t now = time(nullptr);
  while (now < 1700000000) { delay(300); Serial.print("."); now = time(nullptr); }
  Serial.println(" ✓");
}

// ───────────── HELPERS ─────────────
void relay(bool on) {
  digitalWrite(RELAY_PIN, (on == RELAY_ACTIVE_HIGH) ? HIGH : LOW);
}

String uidConEspacios(MFRC522::Uid uid) {       // "A1 B2 C3 D4"
  String s = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) s += "0";
    s += String(uid.uidByte[i], HEX);
    if (i < uid.size - 1) s += " ";
  }
  s.toUpperCase();
  return s;
}
String uidKey(const String& uidEspacios) {      // "A1B2C3D4"
  String k = "";
  for (size_t i = 0; i < uidEspacios.length(); i++) {
    char c = uidEspacios[i];
    if (c != ' ') k += c;
  }
  return k;
}

void abrirBarrera() {
  Serial.println("→ PERMITIDO: abriendo barrera");
  digitalWrite(LED_OK, HIGH);
  if (BUZZER >= 0) { digitalWrite(BUZZER, HIGH); delay(120); digitalWrite(BUZZER, LOW); }
  relay(true);
  delay(OPEN_TIME_MS);
  relay(false);
  digitalWrite(LED_OK, LOW);
}
void rechazar() {
  Serial.println("→ DENEGADO");
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_FAIL, HIGH);
    if (BUZZER >= 0) digitalWrite(BUZZER, HIGH);
    delay(120);
    digitalWrite(LED_FAIL, LOW);
    if (BUZZER >= 0) digitalWrite(BUZZER, LOW);
    delay(120);
  }
}

// ───────────── FIREBASE REST ─────────────
String fbGet(const String& path) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient http; http.setTimeout(8000);
  http.begin(client, String(DB_URL) + path);
  int code = http.GET();
  String body = (code == 200) ? http.getString() : String("null");
  http.end();
  return body;
}
void fbPost(const String& path, const String& json) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient http; http.setTimeout(8000);
  http.begin(client, String(DB_URL) + path);
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}
void fbPut(const String& path, const String& json) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient http; http.setTimeout(8000);
  http.begin(client, String(DB_URL) + path);
  http.addHeader("Content-Type", "application/json");
  http.PUT(json);
  http.end();
}

String esc(const String& s) {  // escape comillas para JSON
  String o = ""; for (size_t i=0;i<s.length();i++){ char c=s[i]; if(c=='"'||c=='\\') o+='\\'; o+=c; } return o;
}

// ───────────── LOOP ─────────────
void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    delay(60);
    return;
  }

  String uid = uidConEspacios(rfid.uid);
  String key = uidKey(uid);
  Serial.println("\nTarjeta: " + uid + "  (key " + key + ")");

  String resp = fbGet("/users/" + key + ".json");
  Serial.println("← " + resp);

  if (resp == "null" || resp.length() < 3) {
    // ── Tarjeta NO registrada → enviar a /enroll para asignarla en la web
    Serial.println("→ NO registrada: enviada a /enroll para registro");
    fbPut("/enroll.json", "{\"uid\":\"" + esc(uid) + "\",\"ts\":" + String(millis()) + "}");
    // parpadeo informativo (ámbar = ambos LEDs)
    digitalWrite(LED_OK, HIGH); digitalWrite(LED_FAIL, HIGH); delay(400);
    digitalWrite(LED_OK, LOW);  digitalWrite(LED_FAIL, LOW);
  } else {
    // ── Tarjeta registrada → evaluar y registrar acceso
    StaticJsonDocument<512> doc;
    bool allowed = false; String name="Usuario", role="", plate="", vt="", reason="";
    if (deserializeJson(doc, resp) == DeserializationError::Ok) {
      bool blocked = doc["blocked"] | false;
      String status = String((const char*)(doc["status"] | "Activo"));
      name  = String((const char*)(doc["name"]  | "Usuario"));
      role  = String((const char*)(doc["role"]  | ""));
      plate = String((const char*)(doc["plate"] | ""));
      vt    = String((const char*)(doc["vehicleType"] | ""));
      if (blocked)              reason = "Usuario bloqueado";
      else if (status != "Activo") reason = "Usuario inactivo";
      else allowed = true;
    } else {
      reason = "Error de lectura";
    }

    // Registrar acceso en /logs
    String log = "{";
    log += "\"uid\":\"" + esc(uid) + "\",";
    log += "\"name\":\"" + esc(name) + "\",";
    log += "\"role\":\"" + esc(role) + "\",";
    log += "\"plate\":\"" + esc(plate) + "\",";
    log += "\"vehicleType\":\"" + esc(vt) + "\",";
    log += "\"gate\":\"La Casona\",";
    log += "\"status\":\"" + String(allowed ? "Permitido" : "Denegado") + "\",";
    log += "\"reason\":" + String(reason.length() ? "\"" + esc(reason) + "\"" : "null") + ",";
    log += "\"ts\":" + String((double)time(nullptr) * 1000.0, 0);
    log += "}";
    fbPost("/logs.json", log);

    if (allowed) abrirBarrera(); else rechazar();
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1200);   // anti-rebote
}
