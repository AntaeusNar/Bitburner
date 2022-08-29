/** Various runtime options for command_control.js */

export const baseDelay = 200; //base delay between batches and cycles in milliseconds // NOTE: decreasing below 200 causes bunching of scripts
export const maxScripts = 10000; //max number of deployable scripts.  > 10,000 seems to create realworld game crashes
export const budget = .5; // multipler for available budget.
