import type { RegistrationInput, RegistrationRepository } from "../../domain/ports/registration-repository";
import { serverDatabase } from "./server";
export class SupabaseRegistrationRepository implements RegistrationRepository {
  async register(input: RegistrationInput): Promise<void> {
    const { error } = await serverDatabase().rpc("register_entry", {
      p_contest_id: input.contestId, p_name: input.name, p_image_path: input.imagePath, p_code_hash: input.codeHash
    });
    if (error) throw error;
  }
  async listPublicImages(contestId: string): Promise<readonly { id:string; imagePath:string }[]> {
    const { data,error } = await serverDatabase().from("entries").select("id,image_path").eq("contest_id",contestId).eq("status","approved").order("created_at",{ascending:true});
    if(error) throw error;
    return (data??[]).map(row=>({id:row.id,imagePath:row.image_path}));
  }
}
