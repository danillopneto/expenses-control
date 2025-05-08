import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
  pure: false
})
export class CurrencyFormatPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '';
    let lang = this.translate.currentLang || 'pt-BR';
    if (lang.startsWith('pt')) lang = 'pt-BR';
    let currency = 'USD';
    if (lang === 'pt-BR') currency = 'BRL';
    // You can add more language/currency mappings here if needed
    const num = typeof value === 'number' ? value : Number(value);
    return num.toLocaleString(lang, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
