import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'pad',
})
export class PadTextPipe implements PipeTransform {
    transform(value: string | number | null | undefined, length: number = 2, padChar: string = ' '): string {
        if (value === 0) {
            return ' 0';
        }

        if (!value) {
            return Array.from({ length }).map(_ => padChar).join('');
        }

        return value.toString().padStart(length, padChar);
    }
}