
export interface Participant {
    id: number;
    name: string;
    score: number;
    eliminated: boolean;
    improvement: -1 | 0 | 1;

    // Foreign key to round::id
    lastRoundScored: number | null;
}
