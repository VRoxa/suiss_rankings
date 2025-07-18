import { inject } from '@angular/core';
import { SupabaseRepository } from '../repositories/supabase.service';
import { PostgrestError } from '@supabase/supabase-js';

export const resetDatabase = async () => {
    const safeExecute = async (
        promise: PromiseLike<{ error: PostgrestError | null }>
    ) => {
        const { error } = await promise;
        if (!!error) {
            throw new Error(error.message);
        }
    };

    const repository = inject(SupabaseRepository);
    const supabase = repository.disposable.raw;

    // Delete records (in order of relation)
    await safeExecute(supabase.from('participant').delete().neq('id', 0));
    await safeExecute(supabase.from('round').delete().neq('id', 0));
    await safeExecute(supabase.from('match').delete().neq('id', 0));
    
    // Reset sequences nack to min. value
    await safeExecute(
        supabase.rpc('reset_sequence', {
            table_name: 'participant',
            sequence_name: 'participant_id_seq',
        })
    );
    await safeExecute(
        supabase.rpc('reset_sequence', {
            table_name: 'round',
            sequence_name: 'round_id_seq',
        })
    );
    await safeExecute(
        supabase.rpc('reset_sequence', {
            table_name: 'match',
            sequence_name: 'match_id_seq',
        })
    );
};
