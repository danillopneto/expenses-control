import { Component, ElementRef, ViewChild } from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { TranslateService } from '@ngx-translate/core';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-numeric-cell-editor',
  template: `
    <input #input matInput [value]="value" (input)="onInput($event)" (keydown.enter)="onEnter()" style="width:100%;font-size:inherit;background:transparent;border:none;outline:none;box-shadow:none;padding:4px 8px;" />
  `,
  standalone: true,
  imports: [MatInputModule],
})
export class NumericCellEditor implements ICellEditorAngularComp {
  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;
  value: string = '';
  private params: any;
  private decimalSeparator: string = '.';

  constructor(private translate: TranslateService) {}

  agInit(params: any): void {
    this.params = params;
    this.value = params.value != null ? params.value.toString() : '';
    const lang = this.translate.currentLang || 'en';
    this.decimalSeparator = lang === 'pt' ? ',' : '.';
  }

  getValue(): any {
    return this.value;
  }

  onInput(event: any) {
    let val = event.target.value;
    // Allow only digits and one decimal separator
    const regex = this.decimalSeparator === ',' ? /[^0-9,]/g : /[^0-9.]/g;
    val = val.replace(regex, '');
    // Only one decimal separator
    const parts = val.split(this.decimalSeparator);
    if (parts.length > 2) {
      val = parts[0] + this.decimalSeparator + parts.slice(1).join('');
    }
    this.value = val;
    event.target.value = val;
  }

  onEnter() {
    this.params.api.stopEditing();
  }

  afterGuiAttached(): void {
    setTimeout(() => this.input.nativeElement.focus());
  }
}
