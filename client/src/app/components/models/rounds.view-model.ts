import { Match } from "../../domain/entities/match.entity";
import { Participant } from "../../domain/entities/participant.entity";
import { Configuration } from "./configuration.model";

export type MatchViewModel = Omit<Match, 'team1 | team2'> & {
    team1: Participant;
    team2: Participant;
}

export type RoundPageViewModel = {
    roundId: number;
    isAuthorized: boolean;
    loading: boolean;
    isCurrentRound: boolean;
    matches: MatchViewModel[];
    isRoundFinished: boolean;
    fullRankingUpdated: boolean;
    isKnockoutRound: boolean;
    configuration: Configuration;
}