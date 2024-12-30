/** Given a server hostname, will attempt to gain root
* @param {ns} ns
* @param {string} hostname
* @returns {boolean} result
*/
export function getRoot(ns, hostname) {
    let result = false;
    let ports = 0;
        if (can(ns, "brutessh.exe")) { ns.brutessh(hostname); ++ports; }
        if (can(ns, "ftpcrack.exe")) { ns.ftpcrack(hostname); ++ports; }
        if (can(ns, "relaysmtp.exe")) { ns.relaysmtp(hostname); ++ports; }
        if (can(ns, "httpworm.exe")) { ns.httpworm(hostname); ++ports; }
        if (can(ns, "sqlinject.exe")) { ns.sqlinject(hostname); ++ports; }
        if (ports >= ns.getServerNumPortsRequired(hostname)) {
            ns.nuke(hostname);
            if (ns.hasRootAccess(hostname)){
                result = true;
            }
        }
    return result;
}

    /**
 * Clamps the value on a lower and an upper bound
 * @param {number} value Value to clamp
 * @param {number} min Lower bound, defaults to negative Number.MAX_VALUE
 * @param {number} max Upper bound, defaults to Number.MAX_VALUE
 * @returns {number} Clamped value
 */
export function clampNumber(value, min = -Number.MAX_VALUE, max = Number.MAX_VALUE) {
    return Math.max(Math.min(value, max), min);
}

/**calculate Intelligence bonus
* ->https://github.com/danielyxie/bitburner/blob/dev/src/PersonObjects/formulas/intelligence.ts
* @param {number} intelligence
* @param {number} weight
* @return {number}
*/
export function calculateIntelligenceBonus(intelligence, weight) {
    return 1 + (weight * Math.pow(intelligence, 0.8))/600;
}