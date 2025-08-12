import { inject } from "@angular/core"
import { SupabaseRepository } from "../repositories/supabase.service"
import { TableName } from "../repositories/types/supabase.types"

type DateFormatKeywords = 'MM' | 'dd' | 'yy' | 'yyyy' | 'HH' | 'mm' | 'ss';
const formatDate = (date: Date, format: string) => {
    const map: {
        [k in DateFormatKeywords]: number | string
    } = {
        MM: date.getMonth() + 1,
        dd: date.getDate(),
        yy: date.getFullYear().toString().slice(-2),
        yyyy: date.getFullYear(),
        HH: date.getHours(),
        mm: date.getMinutes(),
        ss: date.getSeconds(),
    }

    return format.replace(
        /MM|mm|dd|yy|yyyy|HH|ss/g,
        matched => map[matched as DateFormatKeywords]
            .toString()
            .padStart(2, '0')
    );
}

export const exportData = async (): Promise<void> => {
    const repository = inject(SupabaseRepository);
    
    const fetchFrom = async (tableName: TableName) => {
        const { error, data } = await repository.disposable.raw.from(tableName).select('*');
        if (!!error) {
            throw new Error(`(${error.code}) Error exporting data from table ${tableName}, ${error.message}`);
        }

        return data;
    }

    const [rounds, participants, matches] = await Promise.all([
        fetchFrom('round'),
        fetchFrom('participant'),
        fetchFrom('match'),
    ]);

    const data = {
        rounds,
        participants,
        matches
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const tempAnchor = document.createElement('a');
    tempAnchor.href = url;
    tempAnchor.download = `petitsuis_data_${formatDate(new Date(), 'MMdd_HHmm')}.json`;
    document.body.appendChild(tempAnchor);
    tempAnchor.click();
    document.body.removeChild(tempAnchor);
    URL.revokeObjectURL(url);
}