import { inject } from "@angular/core";
import { Participant } from "../entities/participant.entity";
import { SupabaseRepository } from "../repositories/supabase.service";

export const updateParticipant = async (participant: Participant): Promise<void> => {
    const repository = inject(SupabaseRepository);
    await repository.update('participant', participant);
}