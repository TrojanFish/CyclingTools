---
name: cycling-telemetry-pipeline
description: Authoritative domain skill for cycling telemetry (FIT/GPX/TCX), physiological metrics (NP, TSS, IF, PMC), mechanical physics, zero-division guards, and local-first storage resilience in Yolo Cycling.
---

# Cycling Telemetry & Scientific Computing Pipeline (Superpowers Domain Skill)

This skill formalizes the engineering discipline, mathematical models, sensor data cleaning pipelines, and defensive programming standards for the **Yolo Cycling (`Rouleur`)** scientific computing platform.

---

## 1. Core Mathematical & Physiological Formulations

### 1.1 Aerodynamic & Road Resistance Power Balance
The total instantaneous power required by the cyclist ($P_{total}$) represents the sum of aerodynamic drag, rolling resistance, gravitational gradient work, and mechanical transmission losses:

$$P_{rider} = \frac{P_{aero} + P_{rolling} + P_{gravity}}{\eta_{drivetrain}}$$

Where:
- **Aerodynamic Drag**: $P_{aero} = \frac{1}{2} \rho C_d A (v + v_{wind})^2 \cdot v$
  - Standard air density $\rho \approx 1.225 \text{ kg/m}^3$ (adjusted for altitude and temperature)
  - Road bike hood position $C_d A \approx 0.32 \text{ m}^2$, drops position $C_d A \approx 0.28 \text{ m}^2$, TT aero bars $C_d A \approx 0.23 \text{ m}^2$
- **Rolling Resistance**: $P_{rolling} = C_{rr} \cdot m_{total} \cdot g \cdot \cos(\theta) \cdot v$
- **Gravitational Work**: $P_{gravity} = m_{total} \cdot g \cdot \sin(\theta) \cdot v$
- **Drivetrain Efficiency**: $\eta_{drivetrain} \approx 0.965 - 0.980$ (clean wax / lube chain)

### 1.2 Coggan Normalized Power (NP), Intensity Factor (IF) & TSS
Raw average power underestimates the physiological cost of surges and intervals. The 4th-power weighting model must be used:

1. **30-second Rolling Average**: Compute 30s rolling mean power $P_{30s}(t)$ across 1Hz continuous recording.
2. **4th Power Integration**:
   $$NP = \left( \frac{1}{N} \sum_{t=1}^{N} P_{30s}(t)^4 \right)^{1/4}$$
3. **Intensity Factor (IF)**:
   $$IF = \frac{NP}{FTP}$$
4. **Training Stress Score (TSS)**:
   $$TSS = \frac{t_{sec} \cdot NP \cdot IF}{FTP \cdot 3600} \cdot 100$$

### 1.3 Performance Management Chart (PMC) EWMA
Exponentially Weighted Moving Averages track physiological adaptations:
- **Chronic Training Load (Fitness / CTL)**: Time constant $\tau = 42\text{ days}$ ($k = 1 - e^{-1/42} \approx 0.0235$)
  $$CTL_d = CTL_{d-1} + (TSS_d - CTL_{d-1}) \cdot (1 - e^{-1/42})$$
- **Acute Training Load (Fatigue / ATL)**: Time constant $\tau = 7\text{ days}$ ($k = 1 - e^{-1/7} \approx 0.1331$)
  $$ATL_d = ATL_{d-1} + (TSS_d - ATL_{d-1}) \cdot (1 - e^{-1/7})$$
- **Training Stress Balance (Form / TSB)**:
  $$TSB_d = CTL_{d-1} - ATL_{d-1}$$

---

## 2. Sensor Telemetry Stream Ingestion & Cleaning Rules

1. **Sampling Frequency Detection**:
   - Verify whether data points represent uniform 1Hz sampling or variable sparse intervals (Garmin smart recording).
   - If interval $\Delta t > 1\text{s}$, accumulate actual time differences $\sum \Delta t$ rather than raw point counts.
2. **Sensor Spike & Glitch Cleansing**:
   - Power values $> 2500\text{W}$ are flagged as telemetry glitches and clamped or interpolated.
   - Cadence values $> 250\text{ rpm}$ or $< 0$ are sanitized.
   - GPS coordinate jitter: Ignore points where calculated ground speed exceeds $140\text{ km/h}$.
3. **Zero-Division Defense**:
   - Never divide by raw variable without bounding:
     ```ts
     // FORBIDDEN:
     const avgSpeed = (totalDistance / totalTime) * 3.6;

     // REQUIRED:
     const avgSpeed = totalTime > 0 ? (totalDistance / Math.max(totalTime, 1)) * 3.6 : 0;
     ```
4. **Moving Time vs Total Duration**:
   - Moving threshold: velocity $> 1.0\text{ km/h}$ or cadence $> 20\text{ rpm}$ or power $> 10\text{W}$.

---

## 3. Local-First Storage & Defensive Engineering Rules

1. **Storage Quota & Privacy Guards**:
   - Every read, write, or removal on `localStorage` and `sessionStorage` must reside in a `try...catch` block.
   - On exception, gracefully fallback to in-memory defaults without terminating application lifecycle.
2. **Production Hygiene**:
   - Zero `console.log` statements in `src/`.
   - Zero unresolved `TODO` or `FIXME` technical debts.
   - All state initializers must be idempotent and non-crashing.

---

## 4. Automated Verification Commands

Run the automated defensive code scanner to verify zero violations:

```bash
python .agents/skills/cycling-telemetry-pipeline/scripts/defensive_checker.py scan src
```
