import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { ChartData, ChartOptions, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { LocalizedDatePipe } from '../pipes/localized-date.pipe';
import { CommonModule } from '@angular/common';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';

Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, TranslateModule, CurrencyFormatPipe, LocalizedDatePipe],
  templateUrl: './dashboard-summary.component.html',
  styleUrls: ['./dashboard-summary.component.scss'],
})
export class DashboardSummaryComponent implements OnChanges, OnInit {
  @Input() expenses: any[] = [];
  @Input() accounts: any[] = [];
  @Input() categories: any[] = [];

  public lang: string;

  accountDonutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  categoryDonutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  dateBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };
  descriptionBarData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [] }],
  };
  placeBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };

  donutChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        color: '#333',
        font: { weight: 'bold', size: 16 },
        anchor: 'center',
        align: 'center',
        formatter: (value, ctx) => {
          let lang = this.lang;
          if (lang.startsWith('pt')) lang = 'pt-BR';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        clamp: true,
        clip: false,
      },
    },
    layout: { padding: 16 },
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        labels: {
          generateLabels: (chart) => {
            const original =
              Chart.defaults.plugins.legend.labels.generateLabels(chart) || [];
            return original.map((label) => ({
              ...label,
              text:
                typeof label.text === 'string' && label.text.length > 12
                  ? label.text.slice(0, 12) + '…'
                  : label.text,
            }));
          },
        },
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (value, ctx) => {
          let lang = this.lang;
          if (lang.startsWith('pt')) lang = 'pt-BR';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        font: { weight: 'bold' },
      },
    },
    layout: {
      padding: 32,
    },
    scales: {
      x: {
        ticks: {
          callback: function (value, index) {
            // 'this' is the scale, so 'this.chart' is the chart instance
            const labels = (this as any).chart?.data?.labels || [];
            // For other charts, return the label as string
            return typeof value === 'string' ? value : labels[index] ?? value;
          },
        },
      },
    },
  };

  public barDateChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        labels: {
          generateLabels: (chart) => {
            const original =
              Chart.defaults.plugins.legend.labels.generateLabels(chart) || [];
            return original.map((label) => ({
              ...label,
              text:
                typeof label.text === 'string' && label.text.length > 12
                  ? label.text.slice(0, 12) + '…'
                  : label.text,
            }));
          },
        },
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (value, ctx) => {
          let lang = this.lang;
          if (lang.startsWith('pt')) lang = 'pt-BR';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        font: { weight: 'bold' },
      },
    },
    layout: {
      padding: 32,
    },
    scales: {
      x: {
        ticks: {
          callback: function (value, index) {
            // Just return the label as-is, since it's already formatted
            const labels = (this as any).chart?.data?.labels || [];
            return typeof value === 'string' ? value : labels[index] ?? value;
          },
        },
      },
    },
  };

  // Summary metrics
  totalSpend: number = 0;
  avgPerDay: number = 0;
  mostExpensiveItem: { description: string; value: number } | null = null;
  mostExpensiveDay: { date: Date | string; value: number } | null = null;
  mostExpensiveCategory: { category: string; value: number } | null = null;
  placeMostValue: { place: string; value: number } | null = null;
  placeMostCount: { place: string; count: number } | null = null;

  constructor(public translate: TranslateService, private cdr: ChangeDetectorRef) {
    this.lang = this.translate.currentLang || 'pt-BR';
    if (this.lang.startsWith('pt')) this.lang = 'pt-BR';
    this.translate.onLangChange.subscribe((event) => {
      this.lang = event.lang.startsWith('pt') ? 'pt-BR' : event.lang;
      this.prepareCharts();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expenses'] || changes['accounts'] || changes['categories']) {
      this.prepareCharts();
    }
  }

  ngOnInit(): void {
    // Defensive: only call prepareCharts if translate is defined
    if (this.translate) {
      this.prepareCharts();
    }
  }

  prepareCharts() {
    if (
      !this.expenses ||
      this.expenses.length === 0 ||
      !this.categories ||
      this.categories.length == 0 ||
      !this.accounts ||
      this.accounts.length == 0
    ) {
      // Reset summary metrics if no data
      this.totalSpend = 0;
      this.avgPerDay = 0;
      this.mostExpensiveItem = null;
      this.mostExpensiveDay = null;
      this.mostExpensiveCategory = null;
      this.placeMostValue = null;
      this.placeMostCount = null;
      return;
    }
    // Use the expenses as-is, do NOT filter for current month here
    const lang = this.lang;
    // Build id → name maps if accounts/categories provided
    const accountNameMap = Object.fromEntries(
      (this.accounts || []).map((a) => [a.id, a.name])
    );
    const categoryNameMap = Object.fromEntries(
      (this.categories || []).map((c) => [c.id, c.name])
    );

    // --- SUMMARY METRICS ---
    // Total spend
    this.totalSpend = this.expenses.reduce((sum, e) => sum + Number(e.value || 0), 0);

    // Average spent per day
    const uniqueDays = new Set(
      this.expenses.map((e) => {
        const d = LocalizedDatePipe.normalizeDate(e.date);
        return d.toISOString().slice(0, 10);
      })
    );
    this.avgPerDay = uniqueDays.size > 0 ? this.totalSpend / uniqueDays.size : 0;

    // Most expensive item
    const maxItem = this.expenses.reduce((max, e) => (Number(e.value || 0) > Number(max.value || 0) ? e : max), this.expenses[0]);
    this.mostExpensiveItem = maxItem ? { description: maxItem.description, value: Number(maxItem.value) } : null;

    // Most expensive day
    const dayMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const d = LocalizedDatePipe.normalizeDate(e.date);
      const iso = d.toISOString().slice(0, 10);
      dayMap.set(iso, (dayMap.get(iso) || 0) + Number(e.value || 0));
    });
    const dayEntries = Array.from(dayMap.entries());
    const maxDay = dayEntries.length > 0 ? dayEntries.reduce((max, curr) => (curr[1] > max[1] ? curr : max)) : null;
    this.mostExpensiveDay = maxDay ? { date: maxDay[0], value: maxDay[1] } : null;

    // Most expensive category
    const summaryCatMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const name = categoryNameMap[e.category] || e.category || 'Other';
      summaryCatMap.set(name, (summaryCatMap.get(name) || 0) + Number(e.value || 0));
    });
    const catEntries = Array.from(summaryCatMap.entries());
    const maxCat = catEntries.length > 0 ? catEntries.reduce((max, curr) => (curr[1] > max[1] ? curr : max)) : null;
    this.mostExpensiveCategory = maxCat ? { category: maxCat[0], value: maxCat[1] } : null;

    // Place with most expenses (by value)
    const summaryPlaceMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const place = e.place || 'Other';
      summaryPlaceMap.set(place, (summaryPlaceMap.get(place) || 0) + Number(e.value || 0));
    });
    const summaryPlaceEntries = Array.from(summaryPlaceMap.entries());
    const maxPlaceValue = summaryPlaceEntries.length > 0 ? summaryPlaceEntries.reduce((max, curr) => (curr[1] > max[1] ? curr : max)) : null;
    this.placeMostValue = maxPlaceValue ? { place: maxPlaceValue[0], value: maxPlaceValue[1] } : null;

    // Place with most expenses (by count)
    const summaryPlaceCountMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const place = e.place || 'Other';
      summaryPlaceCountMap.set(place, (summaryPlaceCountMap.get(place) || 0) + 1);
    });
    const placeCountEntries = Array.from(summaryPlaceCountMap.entries());
    const maxPlaceCount = placeCountEntries.length > 0 ? placeCountEntries.reduce((max, curr) => (curr[1] > max[1] ? curr : max)) : null;
    this.placeMostCount = maxPlaceCount ? { place: maxPlaceCount[0], count: maxPlaceCount[1] } : null;

    // Donut: by Account
    const accMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const name = accountNameMap[e.accountUsed] || e.accountUsed || 'Other';
      accMap.set(name, (accMap.get(name) || 0) + Number(e.value || 0));
    });
    this.accountDonutData = {
      labels: Array.from(accMap.keys()),
      datasets: [{ data: Array.from(accMap.values()) }],
    };
    // Donut: by Category
    const chartCatMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const name = categoryNameMap[e.category] || e.category || 'Other';
      chartCatMap.set(name, (chartCatMap.get(name) || 0) + Number(e.value || 0));
    });
    this.categoryDonutData = {
      labels: Array.from(chartCatMap.keys()),
      datasets: [{ data: Array.from(chartCatMap.values()) }],
    };
    // Bar: by Date
    const dateMap = new Map<string, { date: Date; value: number }>();
    this.expenses.forEach((e) => {
      const date = LocalizedDatePipe.normalizeDate(e.date);
      if (isNaN(date.getTime())) return;
      const label = LocalizedDatePipe.formatDate(date, this.lang);
      if (!dateMap.has(label)) {
        dateMap.set(label, { date, value: 0 });
      }
      dateMap.get(label)!.value += Number(e.value || 0);
    });
    // Sort by the actual date value
    const dateEntries = Array.from(dateMap.entries()).sort(
      (a, b) => a[1].date.getTime() - b[1].date.getTime()
    );
    this.dateBarData = {
      labels: dateEntries.map((e) => e[0]),
      datasets: [{ data: dateEntries.map((e) => e[1].value), label: 'Total' }],
    };
    // Bar: by Description
    const descMap = this.groupSum(this.expenses, 'description');
    const descEntries = Array.from(descMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    this.descriptionBarData = {
      labels: descEntries.map((e) => e[0]),
      datasets: [{ data: descEntries.map((e) => e[1]), label: 'Total' }],
    };
    // Bar: by Place
    const placeMap = this.groupSum(this.expenses, 'place');
    const placeEntries = Array.from(placeMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    this.placeBarData = {
      labels: placeEntries.map((e) => e[0]),
      datasets: [{ data: placeEntries.map((e) => e[1]), label: 'Total' }],
    };
  }

  groupSum(arr: any[], key: string) {
    const map = new Map<string, number>();
    arr.forEach((e) => {
      const k = e[key] || 'Other';
      map.set(k, (map.get(k) || 0) + Number(e.value || 0));
    });
    return map;
  }
}
