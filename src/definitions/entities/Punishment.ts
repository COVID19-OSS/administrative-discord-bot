import { PunishmentType } from "./PunishmentType";

export interface Punishment {
  punishment_id: number;
  offender_user_id: number;
  moderator_user_id: number;
  reason?: string;
  punishment_type: PunishmentType;
  active: boolean;
  created_at: Date;
  expires_at?: Date;
}
