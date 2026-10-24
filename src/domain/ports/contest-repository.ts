import type { Contest } from "../entities/contest";
export interface ContestRepository {
  findById(id:string):Promise<Contest|null>;
  save(contest:Contest):Promise<void>;
}
