import { inject } from "@angular/core";
import { SupabaseRepository } from "../repositories/supabase.service";
import { Round } from "../entities/round.entity";
import { Participant } from "../entities/participant.entity";
import { Match } from "../entities/match.entity";

const readFromFile = (file: File): Promise<string> => {
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).toString());
        reader.onerror = () => reject(new Error(`Could not read file ${file.name}`));

        reader.readAsText(file);
    });
}

export const importData = async (file: File): Promise<void> => {
    const repository = inject(SupabaseRepository);
    const json = await readFromFile(file);
    const { rounds, participants, matches } = JSON.parse(json);

    if (!rounds || !participants || !matches) {
        throw new Error('Invalid imported data');
    }
    
    await repository.addAll<Round>('round', rounds);
    await repository.addAll<Participant>('participant', participants);
    await repository.addAll<Match>('match', matches);
}
