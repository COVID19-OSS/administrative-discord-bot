export interface Quarantine {
  quarantine_id: number;
  offender_user_id: number;
  moderator_user_id: number;
  reason?: string;
  created_at: Date;
}