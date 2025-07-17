import { Match } from "../../domain/entities/match.entity";
import { Participant } from "../../domain/entities/participant.entity";

export type MatchViewModel = Omit<Match, 'team1 | team2'> & {
    team1: Participant;
    team2: Participant;
}

export type RoundPageViewModel = {
    loading: boolean;
    isCurrentRound: boolean;
    matches: MatchViewModel[];
    isRoundFinished: boolean;
}