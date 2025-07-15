import { inject } from "@angular/core";
import { Participant } from "../entities/participant.entity";
import { SupabaseRepository } from "../repositories/supabase.service";
import { ParticipantViewModel } from "../../components/models/participants.view-model";

export const updateParticipant = async (participant: ParticipantViewModel): Promise<void> => {
    const repository = inject(SupabaseRepository);

    const record: Participant = {
        id: participant.id,
        name: participant.name,
        score: participant.score,
        eliminated: participant.eliminated
    }

    await repository.update('participant', record);
}