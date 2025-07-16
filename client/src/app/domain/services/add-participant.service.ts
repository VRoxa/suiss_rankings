import { inject } from "@angular/core";
import { Participant } from "../entities/participant.entity";
import { AddingEntity } from "../repositories/types/supabase.types";
import { SupabaseRepository } from "../repositories/supabase.service";

export const addParticipant = async (participant: AddingEntity<Participant>): Promise<void> => {
    const repository = inject(SupabaseRepository);
    await repository.add('participant', participant);
}
