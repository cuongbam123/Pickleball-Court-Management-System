const getSkillRankFromElo = (eloScore = 0) => {
  const normalizedElo = Number(eloScore) || 0;

  if (normalizedElo >= 1500) return "A";
  if (normalizedElo >= 1300) return "B";
  if (normalizedElo >= 1100) return "C";
  return "D";
};

module.exports = {
  getSkillRankFromElo,
};
