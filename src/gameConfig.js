const MODES = [
  {
    value: "CLASSIC",
    config: {
      possibleOutcomesCount: 6,
      requestedNumbersCount: 2
    }
  },
  {
    value: "DIGITAL",
    config: {
      possibleOutcomesCount: 10000,
      requestedNumbersCount: 1
    }
  }
];

export const GAME_CONFIG = {
  MODES,
  bonusRangeMultiplier: 1000000
};
