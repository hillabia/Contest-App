import type { ContestRepository } from "../../domain/ports/contest-repository";
import type { Contest } from "../../domain/entities/contest";
import { serverDatabase } from "./server";
export class SupabaseContestRepository implements ContestRepository {
  async findById(id: string): Promise<Contest | null> {
    const { data, error } = await serverDatabase().from("contests").select("id,title,status,registration_ends_at,voting_ends_at").eq("id",id).maybeSingle();
    if (error) throw error;
    return data ? { id:data.id, title:data.title, phase:data.status, registrationEndsAt:new Date(data.registration_ends_at), votingEndsAt:new Date(data.voting_ends_at) } : null;
  }
  async save(): Promise<void> { throw new Error("Contest editing is not implemented"); }
}
