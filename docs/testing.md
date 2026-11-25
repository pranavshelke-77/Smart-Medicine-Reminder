# Testing plan

No results yet. Record raw results in `data/test-log-template.csv`.

| Test | Method | Report |
|---|---|---|
| Reminder accuracy | Reminder set 2 min ahead, compare buzzer start with phone clock, ×10 | Mean and max error (s) |
| Clock drift | Run 24 h, compare with phone | s/day |
| Stop button | Physical and phone stop during alarm | Pass/fail, no retrigger same day |
| Emergency flag | Press button, check status page, clear | Pass/fail |
| Wi-Fi range | Indoors, one wall | Max distance (m) |
| Buzzer loudness | Sound meter at 1 m | dB |
| Power loss | Unplug/replug | Recovers after setting time |
| Enclosure fit | Assemble with lid | Fit, strain-free wires, USB reachable |
