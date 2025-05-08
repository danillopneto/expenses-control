import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter } from '@angular/material/core';
import { Category, Account } from '../interfaces/models';

@Component({
  selector: 'app-expenses-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatExpansionModule,
    MatButtonModule,
    TranslateModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './expenses-filter.component.html',
  styleUrls: ['./expenses-filter.component.scss']
})
export class ExpensesFilterComponent {
  @Input() categories: Category[] = [];
  @Input() accounts: Account[] = [];
  @Input() initialDateFrom?: Date;
  @Input() initialDateTo?: Date;
  @Input() expanded: boolean = true;
  @Output() filterChange = new EventEmitter<any>();

  filterForm: FormGroup;
  collapsed = false;
  private langSub: any;

  constructor(private fb: FormBuilder, private dateAdapter: DateAdapter<Date>, private translate: TranslateService) {
    this.filterForm = this.fb.group({
      dateFrom: [''],
      dateTo: [''],
      description: [''],
      place: [''],
      category: [''],
      accountUsed: ['']
    });
    // Set initial locale
    this.dateAdapter.setLocale(this.translate.currentLang);
    // Subscribe to language changes
    this.langSub = this.translate.onLangChange.subscribe(event => {
      this.dateAdapter.setLocale(event.lang);
    });
  }

  ngOnInit(): void {
    if (this.initialDateFrom) {
      this.filterForm.patchValue({ dateFrom: this.initialDateFrom });
    }
    if (this.initialDateTo) {
      this.filterForm.patchValue({ dateTo: this.initialDateTo });
    }
    if (this.expanded) {
      this.collapsed = false;
    }
    // Emit initial filter if both dates are set
    if (this.initialDateFrom && this.initialDateTo) {
      this.onSearch();
    }
  }

  ngOnDestroy(): void {
    if (this.langSub) {
      this.langSub.unsubscribe();
    }
  }

  private toMDY(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  onSearch() {
    const raw = this.filterForm.value;
    const patch: any = { ...raw };
    if (raw.dateFrom instanceof Date) {
      patch.dateFrom = this.toMDY(raw.dateFrom);
    }
    if (raw.dateTo instanceof Date) {
      patch.dateTo = this.toMDY(raw.dateTo);
    }
    this.filterChange.emit(patch);
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  reset() {
    this.filterForm.reset();
  }
}
