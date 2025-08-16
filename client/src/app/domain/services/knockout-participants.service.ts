import { inject } from "@angular/core"
import { SupabaseRepository } from "../repositories/supabase.service"
import { Participant } from "../entities/participant.entity";
import { getConfiguration } from "./configuration.service";
import { updateParticipant } from "./update-participant.service";

export const knockoutParticipants = async (repository?: SupabaseRepository) => {
    repository ??= inject(SupabaseRepository);
    
    const participants = await repository.disposable.getAll<Participant>('participant');
    const configuration = await getConfiguration(repository);

    const currentOrder = participants
        .filter(({ eliminated }) => !eliminated)
        .sort(({score: a}, {score: b}) => b - a);

    const { participantsToKnockout } = configuration;

    const lastParticipants = currentOrder.slice(participantsToKnockout * -1);
    console.log('[KNOCKOUT] About to knockout participants', lastParticipants);

    await Promise.all(lastParticipants.map((participant) =>
        updateParticipant({
            ...participant,
            eliminated: true
        }, repository),
    ));
}