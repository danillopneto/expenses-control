import { Component, Inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDatepickerToggle } from '@angular/material/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-edit-expense',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatDatepickerToggle,
    TranslateModule,
    MatDialogModule
  ],
  templateUrl: './edit-expense.component.html',
  styleUrls: []
})
export class EditExpenseComponent {
  editForm: FormGroup;
  categories: any[];
  accounts: any[];

  constructor(
    public dialogRef: MatDialogRef<EditExpenseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dateAdapter: DateAdapter<Date>,
    private translate: TranslateService
  ) {
    this.editForm = data.editForm;
    this.categories = data.categories;
    this.accounts = data.accounts;
    // Set initial locale for date adapter
    this.dateAdapter.setLocale(this.translate.currentLang);
    // Update locale on language change
    this.translate.onLangChange.subscribe(event => {
      this.dateAdapter.setLocale(event.lang);
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({ save: true });
  }
}
