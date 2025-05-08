import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';
import { LocalizedDatePipe } from '../pipes/localized-date.pipe';

@Component({
  selector: 'app-dashboard-summary-header',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    CurrencyFormatPipe,
    LocalizedDatePipe,
  ],
  templateUrl: './dashboard-summary-header.component.html',
  styleUrls: ['./dashboard-summary-header.component.scss'],
})
export class DashboardSummaryHeaderComponent implements OnChanges {
  @Input() expenses: any[] = [];
  @Input() categories: any[] = [];
  @Input() accounts: any[] = [];
  @Input() lang: string = 'en';

  totalSpend: number = 0;
  avgPerDay: number = 0;
  mostExpensiveItem: { description: string; value: number } | null = null;
  mostExpensiveDay: { date: Date; value: number } | null = null;
  mostExpensiveCategory: { category: string; value: number } | null = null;
  placeMostValue: { place: string; value: number } | null = null;
  placeMostCount: { place: string; count: number } | null = null;
  accountMostUsed: { account: string; count: number } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateSummary();
  }

  private calculateSummary() {
    if (
      !this.expenses ||
      this.expenses.length === 0 ||
      !this.categories ||
      this.categories.length == 0 ||
      !this.accounts ||
      this.accounts.length == 0
    ) {
      return;
    }

    const accountNameMap = Object.fromEntries(
      (this.accounts || []).map((a: any) => [a.id, a.name])
    );
    const categoryNameMap = Object.fromEntries(
      (this.categories || []).map((c: any) => [c.id, c.name])
    );
    this.totalSpend = this.expenses.reduce(
      (sum, e) => sum + Number(e.value || 0),
      0
    );
    const uniqueDays = new Set(
      this.expenses.map((e) => {
        const d = LocalizedDatePipe.normalizeDate(e.date);
        return d.toISOString().slice(0, 10);
      })
    );
    this.avgPerDay =
      uniqueDays.size > 0 ? this.totalSpend / uniqueDays.size : 0;
    const maxItem = this.expenses.reduce(
      (max, e) => (Number(e.value || 0) > Number(max.value || 0) ? e : max),
      this.expenses[0]
    );
    this.mostExpensiveItem = maxItem
      ? { description: maxItem.description, value: Number(maxItem.value) }
      : null;
    const dayMap = new Map<string, { value: number; date: Date }>();
    this.expenses.forEach((e) => {
      const d = LocalizedDatePipe.normalizeDate(e.date);
      const iso = d.toISOString().slice(0, 10);
      const prev = dayMap.get(iso);
      if (!prev) {
        dayMap.set(iso, { value: Number(e.value || 0), date: d });
      } else {
        dayMap.set(iso, {
          value: prev.value + Number(e.value || 0),
          date: prev.date,
        });
      }
    });
    const dayEntries = Array.from(dayMap.entries());
    const maxDay =
      dayEntries.length > 0
        ? dayEntries.reduce((max, curr) =>
            curr[1].value > max[1].value ? curr : max
          )
        : null;
    this.mostExpensiveDay = maxDay
      ? { date: maxDay[1].date, value: maxDay[1].value }
      : null;
    const summaryCatMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const name = categoryNameMap[e.category] || e.category || 'Other';
      summaryCatMap.set(
        name,
        (summaryCatMap.get(name) || 0) + Number(e.value || 0)
      );
    });
    const catEntries = Array.from(summaryCatMap.entries());
    const maxCat =
      catEntries.length > 0
        ? catEntries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))
        : null;
    this.mostExpensiveCategory = maxCat
      ? { category: maxCat[0], value: maxCat[1] }
      : null;
    const summaryPlaceMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const place = e.place || 'Other';
      summaryPlaceMap.set(
        place,
        (summaryPlaceMap.get(place) || 0) + Number(e.value || 0)
      );
    });
    const summaryPlaceEntries = Array.from(summaryPlaceMap.entries());
    const maxPlaceValue =
      summaryPlaceEntries.length > 0
        ? summaryPlaceEntries.reduce((max, curr) =>
            curr[1] > max[1] ? curr : max
          )
        : null;
    this.placeMostValue = maxPlaceValue
      ? { place: maxPlaceValue[0], value: maxPlaceValue[1] }
      : null;
    const summaryPlaceCountMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const place = e.place || 'Other';
      summaryPlaceCountMap.set(
        place,
        (summaryPlaceCountMap.get(place) || 0) + 1
      );
    });
    const placeCountEntries = Array.from(summaryPlaceCountMap.entries());
    const maxPlaceCount =
      placeCountEntries.length > 0
        ? placeCountEntries.reduce((max, curr) =>
            curr[1] > max[1] ? curr : max
          )
        : null;
    this.placeMostCount = maxPlaceCount
      ? { place: maxPlaceCount[0], count: maxPlaceCount[1] }
      : null;

    // Calculate most used account
    const summaryAccountCountMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const acc = e.accountUsed || e.account || 'Other';
      summaryAccountCountMap.set(
        acc,
        (summaryAccountCountMap.get(acc) || 0) + 1
      );
    });
    const accountCountEntries = Array.from(summaryAccountCountMap.entries());
    const maxAccountCount =
      accountCountEntries.length > 0
        ? accountCountEntries.reduce((max, curr) =>
            curr[1] > max[1] ? curr : max
          )
        : null;
    this.accountMostUsed = maxAccountCount
      ? { account: accountNameMap[maxAccountCount[0]] || maxAccountCount[0], count: maxAccountCount[1] }
      : null;
  }
}
