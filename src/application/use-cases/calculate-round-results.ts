import { calculateResults, podiumTies, rankResults, type RankedScore } from "../../domain/services/results";

export interface RoundResultsReader {
  eligibleEntryIds(roundId:string):Promise<readonly string[]>;
  scoredBallots(roundId:string):Promise<readonly {entryId:string;normalizedScore:number}[]>;
  roundState(roundId:string):Promise<{status:string;endsAt:Date}|null>;
}
export interface RoundResults {
  readonly results:readonly RankedScore[];
  readonly positions:ReturnType<typeof rankResults>;
  readonly podiumTies:ReturnType<typeof podiumTies>;
}
/** Server-only application use case. Do not expose before results are authorized for reveal. */
export class CalculateRoundResults {
  constructor(private readonly reader:RoundResultsReader){}
  async execute(roundId:string,now=new Date()):Promise<RoundResults> {
    const round=await this.reader.roundState(roundId);
    if(!round || now<round.endsAt) throw new Error("La ronda todavía no ha terminado.");
    const [eligible,ballots]=await Promise.all([
      this.reader.eligibleEntryIds(roundId),this.reader.scoredBallots(roundId)
    ]);
    const results=calculateResults(eligible,ballots);
    return {results,positions:rankResults(results),podiumTies:podiumTies(results)};
  }
}
