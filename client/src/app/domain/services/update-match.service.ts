import { inject } from "@angular/core";
import { MatchViewModel } from "../../components/models/rounds.view-model";
import { SupabaseRepository } from "../repositories/supabase.service";
import { Match } from "../entities/match.entity";
import { calculateScore, CountFor } from "./score-calculator.service";
import { getConfiguration } from "./configuration.service";

export const updateMatch = async (match: MatchViewModel): Promise<void> => {
    const repository = inject(SupabaseRepository);
    const { scorePoints } = await getConfiguration();


    let totalScore1 = 0, totalScore2 = 0;
    if (!match.inProgress) {
        totalScore1 = await calculateScore(scorePoints, match.score, CountFor.One);
        totalScore2 = await calculateScore(scorePoints, match.score, CountFor.Two);
    }

    const record: Match = {
        ...match,
        team1: match.team1.id,
        team2: match.team2.id,
        totalScore1,
        totalScore2,
    };

    await repository.update('match', record);
}
