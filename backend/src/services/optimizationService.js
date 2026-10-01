/**
 * GreenH2 Optimization Service
 * -----------------------------
 * Rule-based energy allocation engine. Decides how available renewable
 * energy (solar + wind) should be split between:
 *   1. Hydrogen production (electrolyzer load, up to target/capacity)
 *   2. Battery storage (charge, up to capacity)
 *   3. Grid export / curtailment (excess)
 * and, when generation is short of demand, how to cover the deficit from
 * battery discharge before throttling hydrogen production.
 *
 * Architecture note: this module exposes a single pure function,
 * `runOptimization(input)`, that returns a structured allocation result.
 * It has no DB or HTTP dependencies, so a future ML-based optimizer can be
 * swapped in behind the same function signature.
 */

const ENERGY_PER_KG_H2 = 55; // kWh required to produce 1 kg of hydrogen (typical PEM electrolyzer)

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * "Naive" baseline allocation used purely as a comparison point so the UI
 * can show "current vs optimized" and an efficiency improvement %.
 * Baseline mirrors a typical non-adaptive controller: after demand is met
 * (a hard requirement for either strategy), it applies a FIXED 45/25/30
 * hydrogen/battery/grid split of the remaining surplus regardless of
 * storage headroom, electrolyzer capacity, or targets - meaning it always
 * curtails/exports a flat 30% even when storage has room to absorb it.
 * The rule-based strategy instead only sends energy to the grid once
 * hydrogen production and battery are genuinely full, so it typically
 * captures more useful energy from the same post-demand pool.
 */
function baselineAllocation(remainingAfterDemand) {
  return {
    hydrogen: remainingAfterDemand * 0.45,
    battery: remainingAfterDemand * 0.25,
    grid: remainingAfterDemand * 0.3,
  };
}

/**
 * Rule-based optimization strategy (default / active strategy).
 */
function ruleBasedStrategy(input) {
  const {
    solar,
    wind,
    demand,
    electrolyzerCapacity,
    targetProductionRate,
    batteryLevel,
    batteryCapacity,
    hydrogenLevel,
    hydrogenCapacity,
  } = input;

  const totalGeneration = Math.max(0, solar + wind);
  const batteryAvailableCharge = Math.max(0, ((100 - batteryLevel) / 100) * batteryCapacity);
  const batteryAvailableDischarge = Math.max(0, (batteryLevel / 100) * batteryCapacity);
  const hydrogenRoomLeft = Math.max(0, ((100 - hydrogenLevel) / 100) * hydrogenCapacity);

  let remaining = totalGeneration;
  let hydrogenAlloc = 0;
  let batteryAlloc = 0;
  let gridAlloc = 0;
  let batteryDischarge = 0;
  let deficitCoveredBy = 'none';
  let productionThrottled = false;

  // Step 1: satisfy baseline demand first
  const demandFromGeneration = Math.min(remaining, demand);
  remaining -= demandFromGeneration;
  const deficit = demand - demandFromGeneration;

  if (deficit > 0) {
    batteryDischarge = Math.min(deficit, batteryAvailableDischarge);
    deficitCoveredBy = batteryDischarge >= deficit ? 'battery' : 'battery+shortfall';
  }

  // Step 2: allocate to hydrogen production, capped by electrolyzer capacity,
  // target-derived energy need, and remaining hydrogen storage room.
  const targetEnergyNeed = targetProductionRate * ENERGY_PER_KG_H2;
  const hydrogenCap = Math.min(electrolyzerCapacity, targetEnergyNeed, remaining);

  if (hydrogenRoomLeft <= 0.01) {
    hydrogenAlloc = 0;
    productionThrottled = true;
  } else {
    hydrogenAlloc = clamp(hydrogenCap, 0, remaining);
    if (hydrogenAlloc < targetEnergyNeed) productionThrottled = true;
  }
  remaining -= hydrogenAlloc;

  // Step 3: charge battery with remaining surplus, up to available room
  batteryAlloc = clamp(remaining, 0, batteryAvailableCharge);
  remaining -= batteryAlloc;

  // Step 4: whatever is left is exported to grid / curtailed
  gridAlloc = Math.max(0, remaining);

  const producedH2Rate = hydrogenAlloc / ENERGY_PER_KG_H2;
  const remainingAfterDemand = round2(totalGeneration - demandFromGeneration);

  return {
    totalGeneration,
    remainingAfterDemand,
    hydrogenAlloc: round2(hydrogenAlloc),
    batteryAlloc: round2(batteryAlloc),
    gridAlloc: round2(gridAlloc),
    batteryDischarge: round2(batteryDischarge),
    achievableProductionRate: round2(producedH2Rate),
    productionThrottled,
    deficitCoveredBy,
    utilization: totalGeneration > 0
      ? round2(((hydrogenAlloc + batteryAlloc) / totalGeneration) * 100)
      : 0,
  };
}

/**
 * Entry point used by controllers. Runs the active strategy and also
 * computes a baseline comparison + efficiency improvement percentage.
 */
function runOptimization(input) {
  const optimized = ruleBasedStrategy(input);
  const base = baselineAllocation(optimized.remainingAfterDemand);

  const usefulOptimized = optimized.hydrogenAlloc + optimized.batteryAlloc;
  const usefulBaseline = base.hydrogen + base.battery;

  const efficiencyImprovement = usefulBaseline > 0
    ? round2(((usefulOptimized - usefulBaseline) / usefulBaseline) * 100)
    : 0;

  return {
    input,
    current: {
      hydrogen: round2(base.hydrogen),
      battery: round2(base.battery),
      grid: round2(base.grid),
    },
    optimized: {
      hydrogen: optimized.hydrogenAlloc,
      battery: optimized.batteryAlloc,
      grid: optimized.gridAlloc,
    },
    details: optimized,
    efficiencyImprovement,
    algorithm: 'rule-based-v1',
  };
}

/**
 * Generates alert conditions from the current state of the plant. Kept
 * here (rather than in a controller) so both the /alerts endpoint and any
 * scheduled job can reuse the same rules.
 */
function evaluateAlerts({ solar, wind, demand, batteryLevel, hydrogenLevel }) {
  const alerts = [];
  const totalGeneration = solar + wind;

  if (totalGeneration < demand * 0.5) {
    alerts.push({
      type: 'LOW_RENEWABLE',
      severity: 'WARNING',
      message: `Renewable generation (${round2(totalGeneration)} kW) is critically low relative to demand (${demand} kW).`,
    });
  }
  if (batteryLevel < 15) {
    alerts.push({
      type: 'LOW_BATTERY',
      severity: 'CRITICAL',
      message: `Battery storage at ${batteryLevel}% - approaching depletion.`,
    });
  } else if (batteryLevel > 95) {
    alerts.push({
      type: 'HIGH_BATTERY',
      severity: 'INFO',
      message: `Battery storage at ${batteryLevel}% - near full capacity.`,
    });
  }
  if (hydrogenLevel < 15) {
    alerts.push({
      type: 'LOW_HYDROGEN_STORAGE',
      severity: 'WARNING',
      message: `Hydrogen storage at ${hydrogenLevel}% - consider reducing offtake or increasing production.`,
    });
  } else if (hydrogenLevel > 95) {
    alerts.push({
      type: 'HIGH_HYDROGEN_STORAGE',
      severity: 'WARNING',
      message: `Hydrogen storage at ${hydrogenLevel}% - near capacity, production may need to throttle.`,
    });
  }

  return alerts;
}

module.exports = {
  runOptimization,
  evaluateAlerts,
  ENERGY_PER_KG_H2,
};
