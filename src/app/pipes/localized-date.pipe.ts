import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localizedDate'
})
export class LocalizedDatePipe implements PipeTransform {
  // For template usage only
  transform(value: any, format: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }, lang: string = 'en-US'): string {
    return LocalizedDatePipe.transform(value, lang, format);
  }

  static transform(value: any, lang: string = 'en-US', format: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }): string {
    if (!value) return '';
    let date: Date;
    if (typeof value === 'object' && value.seconds) {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value);
    }
    const locale = lang.startsWith('pt') ? 'pt-BR' : lang;
    return date.toLocaleDateString(locale, format);
  }

  static parse(dateStr: string, lang: string): Date {
    const locale = lang.startsWith('pt') ? 'pt-BR' : lang;
    if (locale === 'pt-BR') {
      // dd/mm/yyyy
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else {
      // mm/dd/yyyy or yyyy-mm-dd
      const parts = dateStr.split(/[\/-]/).map(Number);
      if (parts[0] > 31) return new Date(parts[0], parts[1] - 1, parts[2]); // yyyy-mm-dd
      return new Date(parts[2], parts[0] - 1, parts[1]); // mm/dd/yyyy
    }
  }
}
