/** Library of general functions */


/** Logger print function
 * @param {NS} ns
 * @param {string} message
 * @param {number} [options=2] - 0 program log, 1 terminal log, 2 both
 */
export function logger(ns, message, options=2) {
    switch (options) {
      case 0:
        ns.print(message);
        break;
      case 1:
        ns.tprint(message);
        break;
      case 2:
      default:
        ns.print(message);
        ns.tprint(message);
    }
   }