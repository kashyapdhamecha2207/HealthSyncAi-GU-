// Heuristics for AI Logic as defined in TRD
const calculateRiskScore = (missedAppointments, adherencePercentage, lateArrivals = 0) => {
  let score = 0;

  if (missedAppointments > 2) score += 0.5;
  if (adherencePercentage < 50) score += 0.3;
  if (lateArrivals > 1) score += 0.2;

  let classification = 'LOW';
  if (score > 0.7) classification = 'HIGH';
  else if (score > 0.4) classification = 'MEDIUM';

  return { score, classification };
};

const calculateAdherence = (takenDoses, totalDoses) => {
  if (totalDoses === 0) return 100; // default safe value
  return (takenDoses / totalDoses) * 100;
};

module.exports = {
  calculateRiskScore,
  calculateAdherence
};
