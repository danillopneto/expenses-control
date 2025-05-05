import { Component, ViewChild, ElementRef, forwardRef } from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-datepicker-cell-editor',
  template: `
    <mat-form-field style="width: 100%;">
      <input #input matInput [matDatepicker]="picker" [value]="dateValue" (dateChange)="onDateChange($event)" (keydown.enter)="onEnter()" />
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
  `,
  styles: [':host { display: block; width: 100%; }'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDatepickerToggle
  ],
})
export class DatepickerCellEditor implements ICellEditorAngularComp {
  private params: any;
  public dateValue: string | null = null;
  @ViewChild('input', { static: true, read: ElementRef }) input!: ElementRef<HTMLInputElement>;
  private langSub: any;

  constructor(private dateAdapter: DateAdapter<Date>, private translate: TranslateService) {}

  agInit(params: any): void {
    this.params = params;
    this.dateValue = params.value;
    // Set initial locale
    this.dateAdapter.setLocale(this.translate.currentLang);
    // Subscribe to language changes
    this.langSub = this.translate.onLangChange.subscribe(event => {
      this.dateAdapter.setLocale(event.lang);
    });
  }

  getValue(): any {
    return this.dateValue;
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
      this.dateValue = event.value.toISOString().split('T')[0];
    }
  }

  onEnter() {
    this.params.api.stopEditing();
  }

  afterGuiAttached(): void {
    setTimeout(() => this.input.nativeElement.focus());
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }
}
