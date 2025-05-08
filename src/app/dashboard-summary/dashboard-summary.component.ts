import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  Output,
  EventEmitter,
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
  imports: [CommonModule, BaseChartDirective, TranslateModule],
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
        font: { weight: 'bold', size: 11 }, // smaller font
        display: 'auto', // let Chart.js hide overlapping labels
        anchor: 'center',
        align: 'center',
        formatter: (value, ctx) => {
          let lang = this.lang;
          if (lang.startsWith('pt')) lang = 'pt-BR';
          let currency = 'USD';
          if (lang === 'pt-BR') currency = 'BRL';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        clamp: true,
        clip: true,
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
        font: { weight: 'bold', size: 11 }, // smaller font
        display: 'auto', // let Chart.js hide overlapping labels
        formatter: (value, ctx) => {
          let lang = this.lang;
          if (lang.startsWith('pt')) lang = 'pt-BR';
          let currency = 'USD';
          if (lang === 'pt-BR') currency = 'BRL';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        clamp: true,
        clip: true,
      },
    },
    layout: {
      padding: 32,
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
          minRotation: 30,
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
        font: { weight: 'bold', size: 11 }, // smaller font
        display: 'auto', // let Chart.js hide overlapping labels
        formatter: (value, ctx) => {
          let lang = this.lang;
          if (lang.startsWith('pt')) lang = 'pt-BR';
          let currency = 'USD';
          if (lang === 'pt-BR') currency = 'BRL';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        clamp: true,
        clip: true,
      },
    },
    layout: {
      padding: 32,
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
          minRotation: 30,
          callback: function (value, index) {
            // Just return the label as-is, since it's already formatted
            const labels = (this as any).chart?.data?.labels || [];
            return typeof value === 'string' ? value : labels[index] ?? value;
          },
        },
      },
    },
  };

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
      return;
    }
    const lang = this.lang;
    const accountNameMap = Object.fromEntries(
      (this.accounts || []).map((a) => [a.id, a.name])
    );
    const categoryNameMap = Object.fromEntries(
      (this.categories || []).map((c) => [c.id, c.name])
    );

    const accMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const name = accountNameMap[e.accountUsed] || e.accountUsed || 'Other';
      accMap.set(name, (accMap.get(name) || 0) + Number(e.value || 0));
    });
    this.accountDonutData = {
      labels: Array.from(accMap.keys()),
      datasets: [{ data: Array.from(accMap.values()) }],
    };
    const chartCatMap = new Map<string, number>();
    this.expenses.forEach((e) => {
      const name = categoryNameMap[e.category] || e.category || 'Other';
      chartCatMap.set(name, (chartCatMap.get(name) || 0) + Number(e.value || 0));
    });
    this.categoryDonutData = {
      labels: Array.from(chartCatMap.keys()),
      datasets: [{ data: Array.from(chartCatMap.values()) }],
    };
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
    const dateEntries = Array.from(dateMap.entries()).sort(
      (a, b) => a[1].date.getTime() - b[1].date.getTime()
    );
    this.dateBarData = {
      labels: dateEntries.map((e) => e[0]),
      datasets: [{ data: dateEntries.map((e) => e[1].value), label: 'Total' }],
    };
    const descMap = this.groupSum(this.expenses, 'description');
    const descEntries = Array.from(descMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    this.descriptionBarData = {
      labels: descEntries.map((e) => e[0]),
      datasets: [{ data: descEntries.map((e) => e[1]), label: 'Total' }],
    };
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
