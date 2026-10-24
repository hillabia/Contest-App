export type ContestPhase = "registration" | "voting" | "tiebreak" | "awaiting_reveal" | "revealed" | "purging" | "purged";
export interface Contest {
  readonly id:string;
  readonly title:string;
  readonly phase:ContestPhase;
  readonly registrationEndsAt:Date;
  readonly votingEndsAt:Date;
}
