
export interface MatchScore {
    winner: number;
    score1: number;
    score2: number;
}

export interface Match {
    id: number;

    round: number;
    order: number;

    team1: number;
    team2: number;
    score: [
        MatchScore,
        MatchScore,
        MatchScore | null
    ];
}
