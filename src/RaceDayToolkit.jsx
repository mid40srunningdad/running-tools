import { useState, useMemo } from "react";

export default function RaceDayToolkit() {
  const [units, setUnits] = useState("mi"); // "mi" or "km"
  const [activeTab, setActiveTab] = useState("pacing");

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');
        .display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .grain {
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0);
          background-size: 16px 16px;
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-stone-300 bg-stone-50 grain">
        <div className="max-w-3xl mx-auto px-5 py-8">
          <div className="flex items-baseline justify-between mb-2">
            <span className="mono text-xs uppercase tracking-widest text-stone-500">mid40srunningdad</span>
            <span className="mono text-xs uppercase tracking-widest text-stone-500">v1.0</span>
          </div>
          <h1 className="display text-5xl md:text-6xl font-extrabold tracking-tight leading-none">
            Race Day<br/>
            <span className="italic text-orange-700">Toolkit.</span>
          </h1>
          <p className="mt-4 text-stone-600 max-w-md">
            Two calculators every runner needs on race week — pacing strategy and fuelling. No fluff.
          </p>
        </div>
      </header>

      {/* Unit toggle */}
      <div className="max-w-3xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex gap-1 bg-stone-200 p-1 rounded-full">
          <button
            onClick={() => setUnits("mi")}
            className={`mono text-xs px-4 py-1.5 rounded-full transition ${units === "mi" ? "bg-stone-900 text-stone-50" : "text-stone-600"}`}
          >MILES</button>
          <button
            onClick={() => setUnits("km")}
            className={`mono text-xs px-4 py-1.5 rounded-full transition ${units === "km" ? "bg-stone-900 text-stone-50" : "text-stone-600"}`}
          >KILOMETRES</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-5 pt-6">
        <div className="flex border-b border-stone-300">
          <button
            onClick={() => setActiveTab("pacing")}
            className={`flex-1 py-3 text-left transition ${activeTab === "pacing" ? "border-b-2 border-orange-700" : "border-b-2 border-transparent text-stone-500"}`}
          >
            <div className="mono text-xs uppercase tracking-wider mb-1">01</div>
            <div className="display text-xl font-semibold">Pacing</div>
          </button>
          <button
            onClick={() => setActiveTab("fuel")}
            className={`flex-1 py-3 text-left transition ${activeTab === "fuel" ? "border-b-2 border-orange-700" : "border-b-2 border-transparent text-stone-500"}`}
          >
            <div className="mono text-xs uppercase tracking-wider mb-1">02</div>
            <div className="display text-xl font-semibold">Fuelling</div>
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {activeTab === "pacing" ? <PacingCalculator units={units} /> : <FuelCalculator units={units} />}
      </main>

      <footer className="max-w-3xl mx-auto px-5 py-12 text-center">
        <p className="mono text-xs text-stone-500 uppercase tracking-widest">
          Built by mid40srunningdad · Practice in training, never on race day.
        </p>
      </footer>
    </div>
  );
}

/* ---------- PACING CALCULATOR ---------- */
function PacingCalculator({ units }) {
  const [distance, setDistance] = useState("half"); // 5k, 10k, half, marathon, custom
  const [customDist, setCustomDist] = useState("");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("25");
  const [seconds, setSeconds] = useState("0");
  const [gpsBuffer, setGpsBuffer] = useState("1"); // % faster on watch

  // Distance values in BOTH units (we display in user's chosen unit)
  const distancesKm = { "5k": 5, "10k": 10, half: 21.0975, marathon: 42.195 };
  const distancesMi = { "5k": 3.10686, "10k": 6.21371, half: 13.1094, marathon: 26.2188 };

  const totalDistanceMi = useMemo(() => {
    if (distance === "custom") {
      const v = parseFloat(customDist);
      if (isNaN(v) || v <= 0) return 0;
      return units === "mi" ? v : v * 0.621371;
    }
    return distancesMi[distance];
  }, [distance, customDist, units]);

  const totalDistanceKm = useMemo(() => {
    if (distance === "custom") {
      const v = parseFloat(customDist);
      if (isNaN(v) || v <= 0) return 0;
      return units === "km" ? v : v * 1.60934;
    }
    return distancesKm[distance];
  }, [distance, customDist, units]);

  const totalSeconds = useMemo(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return h * 3600 + m * 60 + s;
  }, [hours, minutes, seconds]);

  const totalUnits = units === "mi" ? totalDistanceMi : totalDistanceKm;
  const goalPaceSec = totalUnits > 0 ? totalSeconds / totalUnits : 0;

  // Build phase-based race plan with integer mile/km ranges
  const plan = useMemo(() => {
    if (totalUnits === 0 || goalPaceSec === 0) return [];
    const target = goalPaceSec;
    const buffer = parseFloat(gpsBuffer) || 0;
    const totalWhole = Math.floor(totalUnits);
    const hasFraction = totalUnits - totalWhole > 0.05;

    // Define phases as fractions, then snap to integer mile/km boundaries
    let phaseDefs;

    if (distance === "5k" || (distance === "custom" && totalUnits < 5)) {
      phaseDefs = [
        { name: "Settle", desc: "Don't go out too hot", end: 0.2, mult: 1.005 },
        { name: "Lock in", desc: "Find your rhythm", end: 0.7, mult: 1.0 },
        { name: "Empty the tank", desc: "Build to the line", end: 1.0, mult: 0.99 },
      ];
    } else if (distance === "10k") {
      phaseDefs = [
        { name: "Settle", desc: "Calm start, don't weave", end: 0.15, mult: 1.01 },
        { name: "Find rhythm", desc: "Settle into goal pace", end: 0.4, mult: 1.003 },
        { name: "Lock in", desc: "Smooth and strong", end: 0.75, mult: 1.0 },
        { name: "Push", desc: "Accelerate if you can", end: 1.0, mult: 0.992 },
      ];
    } else if (distance === "marathon" || (distance === "custom" && totalUnits >= 20)) {
      phaseDefs = [
        { name: "Stay calm", desc: "Slower than feels right", end: 0.1, mult: 1.015 },
        { name: "Settle in", desc: "Ease toward goal pace", end: 0.25, mult: 1.005 },
        { name: "Lock in", desc: "Patient and smooth", end: 0.7, mult: 1.0 },
        { name: "Hold the pace", desc: "This is where it gets hard", end: 0.92, mult: 1.0 },
        { name: "Empty the tank", desc: "Whatever you have left", end: 1.0, mult: 0.995 },
      ];
    } else {
      // Half marathon
      phaseDefs = [
        { name: "Settle", desc: "Stay calm, don't weave", end: 0.08, mult: 1.012 },
        { name: "Ease in", desc: "Find your pace gradually", end: 0.23, mult: 1.005 },
        { name: "Lock in", desc: "Smooth race rhythm", end: 0.75, mult: 1.0 },
        { name: "Hold or push", desc: "Accelerate if strong", end: 0.95, mult: 0.997 },
        { name: "Kick", desc: "Give all you've got", end: 1.0, mult: 0.99 },
      ];
    }

    // Convert phases to integer mile boundaries
    const unitLabel = units === "mi" ? "mi" : "km";
    const result = [];
    let currentStart = 1; // Mile 1 starts at 1

    phaseDefs.forEach((phase, i) => {
      // End mile (rounded to nearest integer, but at least 1 ahead of start)
      let endMile;
      if (i === phaseDefs.length - 1) {
        // Final phase always goes to the end
        endMile = totalWhole;
      } else {
        endMile = Math.max(currentStart, Math.round(phase.end * totalUnits));
      }

      // Skip phase if it would be empty
      if (endMile < currentStart) return;

      // Format range label
      let rangeLabel;
      if (currentStart === endMile) {
        rangeLabel = `${unitLabel === "mi" ? "Mile" : "Km"} ${currentStart}`;
      } else {
        rangeLabel = `${unitLabel === "mi" ? "Miles" : "Kms"} ${currentStart}–${endMile}`;
      }

      const pace = target * phase.mult;
      const watchPace = pace * (1 - buffer / 100);
      result.push({
        name: phase.name,
        desc: phase.desc,
        range: rangeLabel,
        sec: pace,
        watchSec: watchPace,
      });

      currentStart = endMile + 1;
    });

    // Add the final fractional bit (e.g. last 0.1 of a half marathon)
    if (hasFraction && result.length > 0) {
      const lastPhase = result[result.length - 1];
      const finalPace = target * 0.99;
      result.push({
        name: "Final push",
        desc: "Cross that line",
        range: `Last ${(totalUnits - totalWhole).toFixed(2)} ${unitLabel}`,
        sec: finalPace,
        watchSec: finalPace * (1 - buffer / 100),
        isFinal: true,
      });
    }

    return result;
  }, [totalUnits, goalPaceSec, gpsBuffer, units, distance]);

  const formatPace = (s) => {
    if (!s || isNaN(s)) return "—";
    const m = Math.floor(s / 60);
    const sec = Math.round(s - m * 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "—";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s - h * 3600) / 60);
    const sec = Math.round(s - h * 3600 - m * 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <section className="bg-white border border-stone-300 rounded-lg p-6">
        <h2 className="display text-2xl font-semibold mb-5">Your race</h2>

        <Label>Distance</Label>
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {[
            { v: "5k", l: "5K" },
            { v: "10k", l: "10K" },
            { v: "half", l: "Half" },
            { v: "marathon", l: "Marathon" },
            { v: "custom", l: "Custom" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setDistance(opt.v)}
              className={`mono text-xs py-2.5 rounded transition ${
                distance === opt.v
                  ? "bg-stone-900 text-stone-50"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >{opt.l}</button>
          ))}
        </div>

        {distance === "custom" && (
          <div className="mb-5">
            <Label>Custom distance ({units})</Label>
            <input
              type="number"
              step="0.1"
              value={customDist}
              onChange={(e) => setCustomDist(e.target.value)}
              placeholder={units === "mi" ? "e.g. 13.1" : "e.g. 21.1"}
              className="w-full px-3 py-2.5 border border-stone-300 rounded mono text-sm focus:border-orange-700 outline-none"
            />
          </div>
        )}

        <Label>Goal time</Label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <TimeInput label="HRS" value={hours} onChange={setHours} max={6} />
          <TimeInput label="MIN" value={minutes} onChange={setMinutes} max={59} />
          <TimeInput label="SEC" value={seconds} onChange={setSeconds} max={59} />
        </div>

        <Label>GPS buffer (% faster on watch)</Label>
        <div className="flex items-center gap-3 mb-5">
          <input
            type="range"
            min="0"
            max="2"
            step="0.25"
            value={gpsBuffer}
            onChange={(e) => setGpsBuffer(e.target.value)}
            className="flex-1 accent-orange-700"
          />
          <span className="mono text-sm w-12 text-right">{gpsBuffer}%</span>
        </div>
        <p className="text-xs text-stone-500 -mt-3 mb-5">
          GPS watches over-record distance, so you need to run slightly faster on watch to hit your real time. 1% is typical for a city half (~4 sec/mile).
        </p>
      </section>

      {/* Results */}
      {totalUnits > 0 && totalSeconds > 0 && (
        <section className="bg-stone-900 text-stone-50 rounded-lg p-6">
          <h2 className="display text-2xl font-semibold mb-5">Your race plan</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="Goal pace" value={`${formatPace(goalPaceSec)}/${units}`} />
            <Stat label="Watch pace" value={`${formatPace(goalPaceSec * (1 - gpsBuffer / 100))}/${units}`} />
          </div>

          <div className="border-t border-stone-700 pt-5">
            <div className="mono text-xs uppercase tracking-widest text-stone-400 mb-4">Race plan</div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-700">
                  <th className="text-left py-2 mono text-[10px] uppercase tracking-widest text-stone-500 font-normal">Segment</th>
                  <th className="text-right py-2 mono text-[10px] uppercase tracking-widest text-stone-500 font-normal">Target</th>
                  <th className="text-right py-2 mono text-[10px] uppercase tracking-widest text-stone-500 font-normal">Watch</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((phase, i) => (
                  <tr key={i} className="border-b border-stone-800">
                    <td className="py-3">
                      <div className="display text-base font-semibold leading-tight">{phase.range}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{phase.name} · {phase.desc}</div>
                    </td>
                    <td className="py-3 text-right mono text-base align-top">{formatPace(phase.sec)}</td>
                    <td className="py-3 text-right mono text-base text-orange-400 align-top">{formatPace(phase.watchSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 pt-5 border-t border-stone-700">
            <div className="mono text-xs uppercase tracking-widest text-stone-400 mb-2">The strategy</div>
            <p className="text-sm leading-relaxed text-stone-200">
              Start <strong>~1% slower</strong> than goal pace — don't weave, don't chase. Settle into goal pace by{" "}
              {units === "mi" ? "mile 3" : "km 5"}. Hold steady through the middle.{" "}
              From the final third, push if you feel strong. The last {units === "mi" ? "mile" : "kilometre"} should be your fastest.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------- FUEL CALCULATOR ---------- */
function FuelCalculator({ units }) {
  const [distance, setDistance] = useState("half");
  const [customDist, setCustomDist] = useState("");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("25");
  const [intensity, setIntensity] = useState("hard"); // easy, moderate, hard
  const [gel, setGel] = useState("sis_iso"); // default gel
  const [customGelG, setCustomGelG] = useState("");

  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

  // Distance values
  const distancesKm = { "5k": 5, "10k": 10, half: 21.0975, marathon: 42.195 };
  const distancesMi = { "5k": 3.10686, "10k": 6.21371, half: 13.1094, marathon: 26.2188 };

  const totalDistanceUnits = useMemo(() => {
    if (distance === "custom") {
      return parseFloat(customDist) || 0;
    }
    return units === "mi" ? distancesMi[distance] : distancesKm[distance];
  }, [distance, customDist, units]);

  // Carb target g/hr based on duration + intensity
  // Tuned to real-world amateur racing: half marathon at race effort = ~3 gels
  const carbTarget = useMemo(() => {
    if (totalMinutes < 60) return 0; // not really needed
    let target;
    if (totalMinutes < 75) target = 25; // optional fuel zone
    else if (totalMinutes < 120) target = intensity === "hard" ? 45 : intensity === "moderate" ? 35 : 25;
    else if (totalMinutes < 180) target = intensity === "hard" ? 65 : intensity === "moderate" ? 55 : 45;
    else target = intensity === "hard" ? 80 : intensity === "moderate" ? 70 : 60;
    return target;
  }, [totalMinutes, intensity]);

  const totalCarbs = (carbTarget * totalMinutes) / 60;

  const gelOptions = {
    sis_iso: { name: "SiS GO Isotonic", g: 22 },
    sis_beta: { name: "SiS Beta Fuel", g: 40 },
    maurten100: { name: "Maurten Gel 100", g: 25 },
    maurten160: { name: "Maurten Gel 160", g: 40 },
    maurten_caf: { name: "Maurten Gel 100 Caf 100", g: 25 },
    gu: { name: "Gu Energy Gel", g: 22 },
    high5: { name: "High5 Energy Gel", g: 23 },
    precision30: { name: "Precision Fuel PF 30", g: 30 },
    precision90: { name: "Precision Fuel PF 90", g: 90 },
    torq: { name: "Torq Energy Gel", g: 30 },
    custom: { name: "Custom", g: parseFloat(customGelG) || 0 },
  };

  const selectedGel = gelOptions[gel];
  const gelsNeeded = selectedGel.g > 0 ? Math.ceil(totalCarbs / selectedGel.g) : 0;

  // Spaced timing by DISTANCE - rounded to whole miles/km
  // Last gel at ~78% of race - any later won't absorb in time to help
  const gelSchedule = useMemo(() => {
    if (gelsNeeded === 0 || totalDistanceUnits === 0) return [];
    const startUnit = totalDistanceUnits * 0.22;  // ~22% in (mile 3 of a half)
    const endUnit = totalDistanceUnits * 0.78;    // ~78% in (mile 10 of a half)
    const interval = gelsNeeded > 1 ? (endUnit - startUnit) / (gelsNeeded - 1) : 0;
    return Array.from({ length: gelsNeeded }, (_, i) => {
      const unit = gelsNeeded === 1 ? totalDistanceUnits / 2 : startUnit + i * interval;
      return Math.round(unit);
    });
  }, [gelsNeeded, totalDistanceUnits]);

  return (
    <div className="space-y-8">
      <section className="bg-white border border-stone-300 rounded-lg p-6">
        <h2 className="display text-2xl font-semibold mb-5">Your race</h2>

        <Label>Distance</Label>
        <div className="grid grid-cols-3 gap-1.5 mb-5">
          {[
            { v: "half", l: "Half" },
            { v: "marathon", l: "Marathon" },
            { v: "custom", l: "Custom" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setDistance(opt.v)}
              className={`mono text-xs py-2.5 rounded transition ${
                distance === opt.v
                  ? "bg-stone-900 text-stone-50"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >{opt.l}</button>
          ))}
        </div>

        {distance === "custom" && (
          <div className="mb-5">
            <Label>Custom distance ({units})</Label>
            <input
              type="number"
              step="0.1"
              value={customDist}
              onChange={(e) => setCustomDist(e.target.value)}
              placeholder={units === "mi" ? "e.g. 13.1" : "e.g. 21.1"}
              className="w-full px-3 py-2.5 border border-stone-300 rounded mono text-sm focus:border-orange-700 outline-none"
            />
          </div>
        )}

        <Label>Expected race time</Label>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <TimeInput label="HRS" value={hours} onChange={setHours} max={6} />
          <TimeInput label="MIN" value={minutes} onChange={setMinutes} max={59} />
        </div>

        <Label>Effort level</Label>
        <div className="grid grid-cols-3 gap-1.5 mb-5">
          {[
            { v: "easy", l: "Easy" },
            { v: "moderate", l: "Moderate" },
            { v: "hard", l: "Race effort" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setIntensity(opt.v)}
              className={`mono text-xs py-2.5 rounded transition ${
                intensity === opt.v
                  ? "bg-stone-900 text-stone-50"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >{opt.l}</button>
          ))}
        </div>

        <Label>Gel of choice</Label>
        <select
          value={gel}
          onChange={(e) => setGel(e.target.value)}
          className="w-full px-3 py-2.5 border border-stone-300 rounded mono text-sm focus:border-orange-700 outline-none mb-3"
        >
          {Object.entries(gelOptions).map(([k, v]) => (
            <option key={k} value={k}>{v.name}{k !== "custom" ? ` (${v.g}g)` : ""}</option>
          ))}
        </select>
        {gel === "custom" && (
          <input
            type="number"
            value={customGelG}
            onChange={(e) => setCustomGelG(e.target.value)}
            placeholder="Carbs per gel (g)"
            className="w-full px-3 py-2.5 border border-stone-300 rounded mono text-sm focus:border-orange-700 outline-none"
          />
        )}
      </section>

      {totalMinutes > 0 && (
        <section className="bg-stone-900 text-stone-50 rounded-lg p-6">
          <h2 className="display text-2xl font-semibold mb-5">Your fuel plan</h2>

          {totalMinutes < 60 ? (
            <p className="text-stone-300 text-sm">
              For races under an hour, you don't need to fuel during the race. Eat well 2-3 hours before and you're set.
            </p>
          ) : totalMinutes < 75 ? (
            <p className="text-stone-300 text-sm mb-5">
              At under 75 minutes, fuelling is optional. Glycogen stores will carry you. A single gel mid-race can help with focus and finishing kick if you want it.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Stat label="Carbs/hour" value={`${carbTarget}g`} />
                <Stat label="Total carbs" value={`${Math.round(totalCarbs)}g`} />
              </div>

              {gelsNeeded > 0 && (
                <div className="border-t border-stone-700 pt-5">
                  <div className="display text-xl font-semibold mb-2">
                    {gelsNeeded} × {selectedGel.name}
                  </div>
                  <div className="text-stone-400 text-sm mb-1">
                    {gelsNeeded} × {selectedGel.g}g = <span className="text-stone-200 font-semibold">{gelsNeeded * selectedGel.g}g delivered</span>
                  </div>
                  <div className="text-stone-500 text-xs mb-4">
                    {gelsNeeded * selectedGel.g >= totalCarbs
                      ? `Slightly above your ${Math.round(totalCarbs)}g target — a useful buffer.`
                      : `Slightly below your ${Math.round(totalCarbs)}g target — consider one more if you tolerate it.`}
                  </div>

                  <div className="mono text-xs uppercase tracking-widest text-stone-400 mb-3">Take at:</div>
                  <div className="space-y-2">
                    {gelSchedule.map((mark, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full border border-orange-700 text-orange-400 mono text-xs flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div className="mono text-sm">
                          {units === "mi" ? "Mile" : "Km"} {mark}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-stone-700">
                <div className="mono text-xs uppercase tracking-widest text-stone-400 mb-2">Notes</div>
                <ul className="text-sm leading-relaxed text-stone-300 space-y-1.5">
                  <li>• Pair each gel with a few sips of water (not isotonic-only).</li>
                  <li>• Practice this exact plan on at least one long run.</li>
                  <li>• If using caffeine gels, avoid the very first one.</li>
                  {totalMinutes >= 180 && <li>• For 3hr+ efforts, consider mixing gel types to reduce GI risk.</li>}
                </ul>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function Label({ children }) {
  return <div className="mono text-xs uppercase tracking-widest text-stone-500 mb-2">{children}</div>;
}

function TimeInput({ label, value, onChange, max }) {
  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        min={0}
        className="w-full px-3 py-2.5 border border-stone-300 rounded mono text-sm focus:border-orange-700 outline-none text-center"
      />
      <div className="mono text-[10px] uppercase tracking-widest text-stone-400 text-center mt-1">{label}</div>
    </div>
  );
}

function Stat({ label, value, dim }) {
  return (
    <div>
      <div className="mono text-xs uppercase tracking-widest text-stone-400 mb-1">{label}</div>
      <div className={`display text-3xl font-semibold ${dim ? "text-orange-400" : ""}`}>{value}</div>
    </div>
  );
}

function Row({ segment, target, watch }) {
  return (
    <>
      <div className="py-1.5 border-t border-stone-800">{segment}</div>
      <div className="py-1.5 border-t border-stone-800 text-right">{target}</div>
      <div className="py-1.5 border-t border-stone-800 text-right text-orange-400">{watch}</div>
    </>
  );
}

function formatMinutes(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0) return `${h}h ${min}m in`;
  return `${min} min in`;
}
