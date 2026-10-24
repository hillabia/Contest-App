export function scoreRank(position:number,eligibleCount:number):number {
  if(!Number.isInteger(position)||!Number.isInteger(eligibleCount)||eligibleCount<1||position<1||position>eligibleCount)
    throw new RangeError("Invalid rank or eligible entry count");
  return eligibleCount===1?100:(100*(eligibleCount-position))/(eligibleCount-1);
}
export function averageScores(scores:readonly number[]):number {
  if(scores.length===0) throw new RangeError("Cannot average an empty score set");
  if(scores.some(s=>!Number.isFinite(s)||s<0||s>100)) throw new RangeError("Invalid score");
  return scores.reduce((sum,s)=>sum+s,0)/scores.length;
}
