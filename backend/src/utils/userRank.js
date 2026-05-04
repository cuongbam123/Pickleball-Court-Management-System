const RANK_THRESHOLDS = [
  { min: 1500, rank: "A" },
  { min: 1300, rank: "B" },
  { min: 1100, rank: "C" },
  { min: 0, rank: "D" },
];

// Input không hợp lệ (null/undefined/NaN/chuỗi không parse được) => trả null
// để tầng gọi tự quyết định skip hay throw. Tránh silent fallback về "D"
// khiến user bị hạ rank nhầm khi DB có dữ liệu hỏng.
const getSkillRankFromElo = (eloScore) => {
  if (eloScore === null || eloScore === undefined) return null;

  const normalizedElo = Number(eloScore);
  if (!Number.isFinite(normalizedElo)) return null;
  if (normalizedElo < 0) return null;

  for (const { min, rank } of RANK_THRESHOLDS) {
    if (normalizedElo >= min) return rank;
  }
  return "D";
};

module.exports = {
  getSkillRankFromElo,
  RANK_THRESHOLDS,
};
