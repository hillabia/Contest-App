import type { ContestRepository } from "../../domain/ports/contest-repository";
export class GetContest {
  constructor(private readonly contests:ContestRepository){}
  execute(id:string){return this.contests.findById(id);}
}
