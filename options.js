/** Various runtime options for command_control.js */

export const baseDelay = 50; //base delay between batches and cycles in milliseconds // NOTE: decreasing below 200 causes bunching of scripts
export const maxScripts = 10000; //max number of deployable scripts.  > 10,000 seems to create realworld game crashes
export const budgetPercentageLimit = .5; // multipler for available budget.
export const paybackTimeLimit = 1 * 60 * 60; //Time in seconds for payback
export const bitNodeMultipliers = { //bitNodeMultipliers ->placeholder for bitnode info -> https://github.com/danielyxie/bitburner/blob/dev/src/BitNode/BitNode.tsx
  ServerGrowthRate: 1/Math.pow(1.02, 6),
  ScriptHackMoney: 1/Math.pow(1.02, 6),
  HackNetNodeMoneyBitNode: 1/Math.pow(1.02, 6),
}
