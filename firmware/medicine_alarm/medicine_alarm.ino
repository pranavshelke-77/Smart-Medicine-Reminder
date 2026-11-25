/*
  MedAlarm - Smart Medicine Reminder and Emergency Alert System
  Board : ESP32 DevKit V1 (Arduino IDE, "ESP32 Dev Module")
  Mode  : ESP32 runs its own Wi-Fi access point; the phone connects to it
          and opens http://192.168.4.1 to set the reminder. No LCD/OLED.

  Wiring (see docs/wiring.md)
    Active buzzer  +  -> GPIO 25     -  -> GND
    Stop button       -> GPIO 26 and GND (internal pull-up)
    Emergency button  -> GPIO 27 and GND (internal pull-up)

  Changes from the first draft:
    - /save validates the time BEFORE changing the stored reminder.
    - /clear resets the emergency flag (previously it could never be cleared).
*/

#include <WiFi.h>
#include <WebServer.h>
#include <time.h>

const char* apName = "MedicineAlarm";
const char* apPassword = "MedAlarm123";   // change before demonstrating

WebServer server(80);

const int BUZZER_PIN = 25;
const int STOP_PIN = 26;
const int EMERGENCY_PIN = 27;

String medicine = "Medicine";
int alarmHour = 9;
int alarmMinute = 0;

bool alarmActive = false;
bool emergencyAlert = false;
int lastTriggeredDay = -1;

const char* page = R"HTML(
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Medicine Alarm</title>
<style>
body{font-family:Arial;max-width:440px;margin:25px auto;
padding:16px;background:#f1f5f9;color:#172033}
section{background:white;padding:18px;border-radius:14px;
margin-bottom:14px}
input,button{font-size:16px;padding:12px;margin:5px 0;
width:100%;box-sizing:border-box}
button{background:#176b62;color:white;border:0;border-radius:8px}
</style>
</head>
<body>
<h2>Medicine Reminder</h2>
<section>
<form action="/save">
<label>Medicine name</label>
<input name="med" maxlength="40" required>
<label>Reminder time</label>
<input type="time" name="time" value="09:00" required>
<button>Save reminder</button>
</form>
</section>
<section>
<form action="/settime">
<label>Current phone time (24-hour format)</label>
<input name="time" type="datetime-local" required>
<button>Set device time</button>
</form>
</section>
<section>
<button onclick="location.href='/status'">Check status</button>
<button onclick="location.href='/stop'">Stop buzzer</button>
<button onclick="if(confirm('Send emergency alert?'))location.href='/emergency'">
Emergency alert
</button>
<button onclick="location.href='/clear'">Clear emergency</button>
</section>
</body>
</html>
)HTML";

bool clockIsSet() {
  time_t now = time(nullptr);
  return now > 1700000000;
}

void stopAlarm() {
  alarmActive = false;
  digitalWrite(BUZZER_PIN, LOW);
}

void redirectHome() {
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleRoot() {
  server.send(200, "text/html", page);
}

void handleSave() {
  if (!server.hasArg("med") || !server.hasArg("time")) {
    server.send(400, "text/plain", "Invalid reminder settings");
    return;
  }

  String t = server.arg("time");
  int colon = t.indexOf(':');
  if (colon <= 0) {
    server.send(400, "text/plain", "Invalid reminder settings");
    return;
  }

  int newHour = t.substring(0, colon).toInt();
  int newMinute = t.substring(colon + 1).toInt();
  if (newHour < 0 || newHour > 23 || newMinute < 0 || newMinute > 59) {
    server.send(400, "text/plain", "Invalid reminder settings");
    return;
  }

  medicine = server.arg("med");
  alarmHour = newHour;
  alarmMinute = newMinute;
  lastTriggeredDay = -1;
  redirectHome();
}

void handleSetTime() {
  if (!server.hasArg("time")) {
    server.send(400, "text/plain", "Missing time");
    return;
  }

  String t = server.arg("time");
  int y, mo, d, h, mi;

  if (sscanf(t.c_str(), "%d-%d-%dT%d:%d", &y, &mo, &d, &h, &mi) != 5 ||
      y < 2024 || mo < 1 || mo > 12 || d < 1 || d > 31 ||
      h < 0 || h > 23 || mi < 0 || mi > 59) {
    server.send(400, "text/plain", "Invalid date and time");
    return;
  }

  struct tm tmNow = {};
  tmNow.tm_year = y - 1900;
  tmNow.tm_mon = mo - 1;
  tmNow.tm_mday = d;
  tmNow.tm_hour = h;
  tmNow.tm_min = mi;
  tmNow.tm_isdst = -1;

  time_t epoch = mktime(&tmNow);
  struct timeval tv = { epoch, 0 };
  settimeofday(&tv, nullptr);
  redirectHome();
}

void handleStatus() {
  String s = "Medicine: " + medicine +
    "\nReminder: " + String(alarmHour) + ":" +
    (alarmMinute < 10 ? "0" : "") + String(alarmMinute) +
    "\nClock set: " + String(clockIsSet() ? "Yes" : "No") +
    "\nAlarm active: " + String(alarmActive ? "Yes" : "No") +
    "\nEmergency alert: " + String(emergencyAlert ? "YES" : "No");
  server.send(200, "text/plain", s);
}

void handleStop() {
  stopAlarm();
  redirectHome();
}

void handleEmergency() {
  emergencyAlert = true;
  server.send(200, "text/plain",
    "Emergency alert registered on the device. "
    "No SMS or telephone call was sent.");
}

void handleClear() {
  emergencyAlert = false;
  redirectHome();
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(STOP_PIN, INPUT_PULLUP);
  pinMode(EMERGENCY_PIN, INPUT_PULLUP);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(apName, apPassword);

  server.on("/", handleRoot);
  server.on("/save", handleSave);
  server.on("/settime", handleSetTime);
  server.on("/status", handleStatus);
  server.on("/stop", handleStop);
  server.on("/emergency", handleEmergency);
  server.on("/clear", handleClear);
  server.begin();

  Serial.print("Connect to Wi-Fi: ");
  Serial.println(apName);
  Serial.print("Open browser at http://");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  server.handleClient();

  if (digitalRead(STOP_PIN) == LOW) {
    stopAlarm();
  }

  if (digitalRead(EMERGENCY_PIN) == LOW) {
    emergencyAlert = true;
  }

  if (clockIsSet()) {
    time_t now = time(nullptr);
    struct tm localTime;
    localtime_r(&now, &localTime);

    if (localTime.tm_hour == alarmHour &&
        localTime.tm_min == alarmMinute &&
        localTime.tm_yday != lastTriggeredDay) {
      alarmActive = true;
      lastTriggeredDay = localTime.tm_yday;
    }
  }

  if (alarmActive) {
    digitalWrite(BUZZER_PIN, (millis() / 400) % 2);   // beep 400 ms on / off
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  delay(10);
}
