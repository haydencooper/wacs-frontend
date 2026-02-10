export function calcKD(kills: number, deaths: number): string {
  return deaths > 0 ? (kills / deaths).toFixed(2) : "0.00"
}

export function calcKDNumeric(kills: number, deaths: number): number {
  return deaths > 0 ? kills / deaths : 0
}

export function calcWinPct(wins: number, totalMaps: number): string {
  return totalMaps > 0 ? `${((wins / totalMaps) * 100).toFixed(0)}%` : "0%"
}

export function calcWinPctNumeric(wins: number, totalMaps: number): number {
  return totalMaps > 0 ? (wins / totalMaps) * 100 : 0
}
