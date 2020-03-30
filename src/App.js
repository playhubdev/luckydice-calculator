import React from "react";
import "./styles.css";
import Decimal from "decimal.js";
import {
  randomNumberGenerator,
  calculateOutcomes,
  base64ToArray
} from "./utils";
import { GAME_CONFIG } from "./gameConfig";

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      serverSeed: "",
      clientSeed: "",
      nonce: 0,
      bonusOption:
        "W1swLFsiMC4wMDI1IiwxMF1dLFsxLFsiMC4wMDE0Mjg1NzE0Mjg1NzE0Mjg1NzE0Mjg1NzE0IiwxMCxbIjE2IiwiOCIsIjQiLCIyIiwiMSIsIjIiLCI0IiwiOCIsIjE2Il1dXSxbMixbIjAuMDAxNDI4NTcxNDI4NTcxNDI4NTcxNDI4NTcxNCIsNSxbIjgiLCI1IiwiMiIsIjEiLCI4IiwiNSIsIjIiLCIxIl1dXV0=",
      difficulty: "0"
    };
    this.bonusConfigArray = base64ToArray(this.state.bonusOption);
  }

  render() {
    return (
      <div className="app">
        <div className="controls">
          <input
            onChange={this.setParameter("serverSeed")}
            type="text"
            value={this.state.serverSeed}
            placeholder="Server seed"
          />
          <input
            onChange={this.setParameter("clientSeed")}
            type="text"
            value={this.state.clientSeed}
            placeholder="Client seed"
          />
          <input
            onChange={this.setParameter("nonce")}
            type="number"
            value={this.state.nonce}
          />
          <input
            onChange={this.setParameter("bonusOption")}
            type="text"
            value={this.state.bonusOption}
          />
          <select
            value={this.state.difficulty}
            onChange={this.setParameter("difficulty")}
          >
            {GAME_CONFIG.MODES.map((mode, index) => {
              return (
                <option value={index} key={`option-${index}`}>
                  {mode.value}
                </option>
              );
            })}
          </select>
        </div>
        {this.renderTicket()}
      </div>
    );
  }

  renderTicket() {
    const data = this.getTicketDetailsFromOutcomes()[0];
    const values = data.values.map((value, index) => (
      <div key={`key-value-${index}`}>{value}</div>
    ));
    const bonuses =
      data.bonus &&
      data.bonus.results.map((value, index) => (
        <div key={`key-bonus-${index}`}>
          {Array.isArray(value) ? (
            value.map(v => <div>{v}</div>)
          ) : (
            <div>{value}</div>
          )}
        </div>
      ));
    return (
      <div className="result">
        <div className="values">{values}</div>
        {bonuses && <div className="bonus-title">{data.bonus.type}</div>}
        {bonuses && <div className="bonuses">{bonuses}</div>}
      </div>
    );
  }

  setParameter = parameter => e => {
    if (parameter === "bonusOption") {
      this.bonusConfigArray = base64ToArray(e.target.value);
    }
    this.setState({
      [parameter]: e.target.value
    });
  };

  generator = round => {
    return randomNumberGenerator(
      this.state.serverSeed,
      this.state.clientSeed,
      this.state.nonce,
      round
    );
  };

  getCurrentModeStructure = () => {
    const difficultyConfig = GAME_CONFIG.MODES[this.state.difficulty].config;
    return [
      [
        ...new Array(difficultyConfig.requestedNumbersCount).fill(
          difficultyConfig.possibleOutcomesCount
        ),
        GAME_CONFIG.bonusRangeMultiplier
      ]
    ];
  };

  getTicketDetailsFromOutcomes = () => {
    const difficultyConfig = GAME_CONFIG.MODES[this.state.difficulty].config;
    const isDigital = this.state.difficulty === "1";
    const ticketOutcomes = this.getOutcomes();
    const outcomes = ticketOutcomes.map(rowData => {
      const values = rowData.slice(0, difficultyConfig.requestedNumbersCount);
      const bonusOutcome = rowData[difficultyConfig.requestedNumbersCount];
      const receivedBonusConfig = this.getCellBonus(bonusOutcome);
      const adjustedValues = isDigital
        ? values.map(i => {
            console.log(i);
            return new Decimal(i).dividedBy(100).toFixed();
          })
        : values.map(i => i + 1);
      if (receivedBonusConfig) {
        const bonusType = receivedBonusConfig[0];
        const bonusSpinPayouts = receivedBonusConfig[1][2];
        const bonusOutcomes = this.getBonusOutcomes(receivedBonusConfig);
        if (bonusType === 0) {
          return {
            values: adjustedValues,
            bonus: {
              results: bonusOutcomes.map(i =>
                isDigital ? [new Decimal(i[0]).dividedBy(100).toFixed()] : i
              ),
              type: "Free Spins"
            }
          };
        } else if (bonusType === 1) {
          return {
            values: adjustedValues,
            bonus: {
              results: bonusOutcomes.map(
                i => bonusSpinPayouts[i.reduce((sum, j) => sum + j, 0)]
              ),
              type: "Plinko"
            }
          };
        } else if (bonusType === 2) {
          return {
            values: adjustedValues,
            bonus: {
              results: bonusOutcomes.map(i => bonusSpinPayouts[i]),
              type: "Wheely"
            }
          };
        }
      } else {
        return {
          values: adjustedValues
        };
      }
    });
    return outcomes;
  };

  getCellBonus = number => {
    try {
      const configArray = this.bonusConfigArray;
      const { bonusRangeMultiplier } = GAME_CONFIG;
      let start = 0;
      for (let i = 0; i < configArray.length; i++) {
        let end =
          start +
          new Decimal(configArray[i][1][0])
            .times(bonusRangeMultiplier)
            .floor()
            .toNumber();
        if (number >= start && number < end) {
          return configArray[i];
        } else {
          start = end;
        }
      }
    } catch (e) {
      return;
    }
  };

  getOutcomes = () => {
    console.log(this.getCurrentModeStructure());
    return calculateOutcomes(this.getCurrentModeStructure(), this.generator);
  };

  getBonusOutcomes = bonusConfig => {
    return calculateOutcomes(
      this.getCurrentBonusStructure(bonusConfig),
      this.generator,
      1
    );
  };

  getCurrentBonusStructure = bonusConfig => {
    const difficultyConfig = GAME_CONFIG.MODES[this.state.difficulty].config;
    if (bonusConfig[0] === 0) {
      return new Array(bonusConfig[1][1]).fill(
        new Array(difficultyConfig.requestedNumbersCount).fill(
          difficultyConfig.possibleOutcomesCount
        )
      );
    } else if (bonusConfig[0] === 1) {
      return new Array(bonusConfig[1][1]).fill(
        new Array(bonusConfig[1][2].length - 1).fill(2)
      );
    } else {
      return new Array(bonusConfig[1][1]).fill(
        new Array(1).fill(bonusConfig[1][2].length)
      );
    }
  };
}
