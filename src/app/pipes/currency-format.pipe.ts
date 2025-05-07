import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: number | string | null | undefined): string {
    if (value == null || value === '') return '';
    let lang = this.translate.currentLang || 'pt-BR';
    if (lang.startsWith('pt')) lang = 'pt-BR';
    const num = typeof value === 'number' ? value : Number(value);
    return num.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
