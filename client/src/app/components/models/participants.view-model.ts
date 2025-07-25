import { Participant } from "../../domain/entities/participant.entity";

export type ParticipantsPageViewModel = {
    isAuthorized: boolean;
    loading: boolean;
    data: Participant[];
    canStart: boolean;
}