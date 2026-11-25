# Project overview

## Problem
Missed or late medicine doses are common, especially for elderly users taking several medicines. A dedicated reminder placed next to the medicine is harder to ignore than a phone alarm.

## Objectives
- Set the medicine name and reminder time from a phone.
- Sound a buzzer when the medicine is due.
- Stop the alarm with a physical button (or from the phone).
- Raise an emergency alert with a separate physical button.
- Remove the physical display to make the device smaller and simpler.

## Design decision: ESP32 only vs ESP32 + GSM

| Feature | ESP32 only (chosen) | ESP32 + GSM (SIM800L) |
|---|---|---|
| Set alarm from phone | Yes, via Wi-Fi | Yes |
| Stop buzzer from phone | Yes, via Wi-Fi | Yes, extra programming |
| Works without internet | Yes, own Wi-Fi AP | Yes, mobile network |
| SMS alerts | No | Yes |
| Emergency calls | No | Yes, with SIM and network |

The ESP32-only version was chosen for the first prototype. GSM is a planned upgrade for real emergency notifications.
