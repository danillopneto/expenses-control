import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localizedDate'
})
export class LocalizedDatePipe implements PipeTransform {
  // For template usage only
  transform(value: any, format: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }, lang: string = 'en-US'): string {
    return LocalizedDatePipe.transform(value, lang, format);
  }

  /**
   * Normalize any supported date input to a Date object.
   */
  static normalizeDate(value: any): Date {
    if (!value) return new Date('');
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value.toDate instanceof Function) {
      return value.toDate(); // e.g., Firestore Timestamp
    }
    if (typeof value === 'object' && value.seconds !== undefined) {
      return new Date(value.seconds * 1000);
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return new Date(value);
  }

  /**
   * Format a Date object using Intl.DateTimeFormat.
   */
  static formatDate(date: Date, lang: string = 'en-US', format: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }): string {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    const locale = lang.startsWith('pt') ? 'pt-BR' : lang;
    return new Intl.DateTimeFormat(locale, format).format(date);
  }

  static transform(value: any, lang: string = 'en-US', format: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }): string {
    if (!value) return '';
    const date = LocalizedDatePipe.normalizeDate(value);
    return LocalizedDatePipe.formatDate(date, lang, format);
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
