import { HmacSHA256 } from "crypto-js";
import Decimal from "decimal.js";
// Random number generation from: serverSeed, clientSeed, nonce and round
export function* randomNumberGenerator(serverSeed, clientSeed, nonce, round) {
  let extra = 0;
  while (true) {
    const hash = Buffer.from(
      HmacSHA256(
        `${clientSeed}:${nonce}:${round}:${extra++}`,
        serverSeed
      ).toString(),
      "hex"
    );
    let cursor = 0;
    while (cursor < hash.byteLength / 4) {
      yield hash
        .slice(cursor * 4, ++cursor * 4)
        .reduce(
          (sum, byte, index) =>
            sum.add(new Decimal(byte).dividedBy(256 ** (index + 1))),
          new Decimal(0)
        );
    }
    cursor = 0;
  }
}

export const calculateOutcomes = (
  gameStructure,
  numberGenerator,
  startingRound = 0
) => {
  const outcomes = [];
  let i = startingRound;
  for (let item of gameStructure) {
    const generator = numberGenerator(i);
    i++;
    let outcomeRow = [];
    for (let inner of item) {
      outcomeRow.push(
        new Decimal(generator.next().value.toNumber())
          .times(inner)
          .trunc()
          .toNumber()
      );
    }
    outcomes.push(outcomeRow);
  }
  return outcomes;
};

export const base64ToArray = base64String => {
  try {
    const str = window.atob(base64String);
    return JSON.parse(str);
  } catch (error) {
    return;
  }
};
