export interface RegistrationInput { contestId: string; name: string; imagePath: string; codeHash: string }
export interface RegistrationRepository {
  register(input: RegistrationInput): Promise<void>;
  listPublicImages(contestId: string): Promise<readonly { id: string; imagePath: string }[]>;
}
