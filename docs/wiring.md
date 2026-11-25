# Wiring

| Component | Terminal | ESP32 pin |
|---|---|---|
| Active buzzer | + | GPIO 25 |
| Active buzzer | − | GND |
| Stop button | terminal 1 / terminal 2 | GPIO 26 / GND |
| Emergency button | terminal 1 / terminal 2 | GPIO 27 / GND |
| Power | — | Micro-USB 5 V |

- Buttons are active-low; the firmware uses `INPUT_PULLUP`, so no external resistors are needed.
- Keep GPIO current within the ESP32 rating (about 20 mA continuous recommended). Use a transistor for a higher-current buzzer.
- Check all wiring before powering on. Only low-voltage USB power is used.
