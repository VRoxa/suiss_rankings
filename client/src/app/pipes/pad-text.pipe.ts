import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'pad',
})
export class PadTextPipe implements PipeTransform {
    transform(value: string | number | null | undefined, length: number = 2, padChar: string = ' ', position: 'start' | 'end' = 'start'): string {
        if (!value && value !== 0) {
            return Array.from({ length }).map(_ => padChar).join('');
        }
        
        return position === 'start'
            ? value.toString().padStart(length, padChar)
            : value.toString().padEnd(length, padChar);
    }
}