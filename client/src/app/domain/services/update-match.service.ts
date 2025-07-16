import { inject } from "@angular/core";
import { MatchViewModel } from "../../components/models/rounds.view-model";
import { SupabaseRepository } from "../repositories/supabase.service";
import { Match } from "../entities/match.entity";

export const updateMatch = async (match: MatchViewModel): Promise<void> => {
    const repository = inject(SupabaseRepository);

    const record: Match = {
        ...match,
        team1: match.team1.id,
        team2: match.team2.id,
    };

    await repository.update('match', record);
}
