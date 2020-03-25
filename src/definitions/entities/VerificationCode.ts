export interface VerificationCode {
  verification_code_id: number;
  code: string;
  created_at: Date;
  valid_to: Date;
}
