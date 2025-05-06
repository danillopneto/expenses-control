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
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule
  ],
  templateUrl: './expenses-filter.component.html',
  styleUrls: ['./expenses-filter.component.scss']
})
export class ExpensesFilterComponent {
  @Input() categories: { id: string, name: string }[] = [];
  @Input() accounts: { id: string, name: string }[] = [];
  @Output() filterChange = new EventEmitter<any>();

  filterForm: FormGroup;
  collapsed = false;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      dateFrom: [''],
      dateTo: [''],
      description: [''],
      place: [''],
      category: [''],
      accountUsed: ['']
    });
  }

  onSearch() {
    this.filterChange.emit(this.filterForm.value);
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  reset() {
    this.filterForm.reset();
  }
}
