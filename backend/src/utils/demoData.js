// Generates realistic-looking synthetic data so the platform works fully
// without physical sensors or paid weather/energy APIs.

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function solarAtHour(hour, capacity = 500) {
  const peak = 13;
  const spread = 4.2;
  const factor = Math.exp(-Math.pow(hour - peak, 2) / (2 * spread * spread));
  const noise = randomBetween(0.85, 1.05);
  return hour >= 6 && hour <= 19 ? round2(capacity * factor * noise) : round2(capacity * 0.01);
}

function windAtHour(hour, capacity = 400) {
  const base = 0.45 + 0.25 * Math.sin((hour / 24) * Math.PI * 2 + 1.2);
  const noise = randomBetween(0.75, 1.15);
  return round2(clamp(capacity * base * noise, capacity * 0.05, capacity * 0.95));
}

function demandAtHour(hour, base = 350) {
  const morning = Math.exp(-Math.pow(hour - 9, 2) / (2 * 2.5 * 2.5));
  const evening = Math.exp(-Math.pow(hour - 19, 2) / (2 * 3 * 3));
  const factor = 0.55 + 0.45 * Math.max(morning, evening);
  const noise = randomBetween(0.9, 1.1);
  return round2(base * factor * noise);
}

function buildHistoricalSeries(hoursBack = 24) {
  const now = new Date();
  const series = [];
  for (let i = hoursBack - 1; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = ts.getHours();
    series.push({
      timestamp: ts,
      solar: solarAtHour(hour),
      wind: windAtHour(hour),
      demand: demandAtHour(hour),
    });
  }
  return series;
}

function buildForecastSeries(hoursForward = 24) {
  const now = new Date();
  const series = [];
  for (let i = 1; i <= hoursForward; i++) {
    const ts = new Date(now.getTime() + i * 60 * 60 * 1000);
    const hour = ts.getHours();
    series.push({
      timestamp: ts,
      solar: solarAtHour(hour),
      wind: windAtHour(hour),
      demand: demandAtHour(hour),
    });
  }
  return series;
}

module.exports = {
  solarAtHour,
  windAtHour,
  demandAtHour,
  buildHistoricalSeries,
  buildForecastSeries,
  round2,
  clamp,
  randomBetween,
};
