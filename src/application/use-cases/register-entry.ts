import { canRegister, validateDisplayName } from "../../domain/services/registration";
import type { ContestRepository } from "../../domain/ports/contest-repository";
import type { RegistrationRepository } from "../../domain/ports/registration-repository";
export class RegisterEntry {
  constructor(private readonly contests: ContestRepository, private readonly entries: RegistrationRepository) {}
  async execute(input: { contestId: string; name: string; imagePath: string; codeHash: string }, now = new Date()): Promise<void> {
    const contest = await this.contests.findById(input.contestId);
    if (!contest || !canRegister(now, contest.registrationEndsAt, contest.phase)) throw new Error("Las inscripciones están cerradas.");
    await this.entries.register({ ...input, name: validateDisplayName(input.name) });
  }
}
