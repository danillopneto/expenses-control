import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType, ChartOptions, ChartData, Chart, registerables } from 'chart.js';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FirebaseService } from '../shared/firebase.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Subscription } from 'rxjs';
import { CurrencyFormatPipe } from '../pipes/currency-format.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';

Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    TranslateModule,
    MatCardModule,
    CurrencyFormatPipe,
    MatExpansionModule
  ],
  providers: [CurrencyFormatPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);
  private translate = inject(TranslateService);
  private currencyFormatPipe = inject(CurrencyFormatPipe);
  private langSub?: Subscription;
  expenses: any[] = [];
  public monthlyExpenses: any[] = [];
  accounts: any[] = [];
  categories: any[] = [];
  private accountNameMap: Record<string, string> = {};
  private categoryNameMap: Record<string, string> = {};

  @ViewChild('accountDonutChart') accountDonutChart?: BaseChartDirective;
  @ViewChild('categoryDonutChart') categoryDonutChart?: BaseChartDirective;

  // Chart data variables
  public accountDonutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  public categoryDonutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  public dateBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };
  public descriptionBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };
  public placeBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };

  public accountDonutTotal = 0;
  public categoryDonutTotal = 0;

  public donutChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        color: '#333',
        font: { weight: 'bold', size: 16 },
        anchor: 'center',
        align: 'center',
        formatter: (value, ctx) => {
          // Use Angular's language selector
          let lang = this.translate.currentLang || 'en-US';
          if (lang.startsWith('pt')) lang = 'pt-BR';
          const val = typeof value === 'number' ? value : 0;
          return val.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },
        clamp: true,
        clip: false
      }
    },
    layout: {
      padding: 16
    }
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (value, ctx) => value,
        font: { weight: 'bold' }
      }
    },
    layout: {
      padding: 32
    }
  };

  monthlySummaryExpanded = true;
  toggleMonthlySummary() {
    this.monthlySummaryExpanded = !this.monthlySummaryExpanded;
  }

  chartTotalUpdatePlugin = {
    id: 'chartTotalUpdatePlugin',
    afterUpdate: (chart: Chart) => {
      if (chart.canvas === this.accountDonutChart?.chart?.canvas) {
        this.updateAccountDonutTotal();
      }
      if (chart.canvas === this.categoryDonutChart?.chart?.canvas) {
        this.updateCategoryDonutTotal();
      }
    }
  };

  async ngOnInit() {
    const user = await this.auth.currentUser;
    if (!user) return;
    // Fetch expenses, accounts, and categories in parallel
    const [expensesSnap, accountsSnap, categoriesSnap] = await Promise.all([
      this.firebaseService.getAllForUser(user.uid, 'expenses'),
      this.firebaseService.getAllForUser(user.uid, 'accounts'),
      this.firebaseService.getAllForUser(user.uid, 'categories'),
    ]);
    this.expenses = expensesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    this.accounts = accountsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    this.categories = categoriesSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    // Build id → name maps
    this.accountNameMap = Object.fromEntries(this.accounts.map(a => [a.id, a.name]));
    this.categoryNameMap = Object.fromEntries(this.categories.map(c => [c.id, c.name]));
    this.prepareCharts();
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.updateDonutChartOptions();
    });
    this.updateDonutChartOptions();
    Chart.register(this.chartTotalUpdatePlugin);
  }

  ngOnDestroy() {
    if (this.langSub) this.langSub.unsubscribe();
  }

  updateDonutChartOptions() {
    const lang = this.translate.currentLang || 'en-US';
    const locale = lang.startsWith('pt') ? 'pt-BR' : 'en-US';
    this.donutChartOptions = {
      ...this.donutChartOptions,
      plugins: {
        ...this.donutChartOptions.plugins,
        datalabels: {
          ...this.donutChartOptions.plugins?.datalabels,
          formatter: (value, ctx) => this.currencyFormatPipe.transform(value)
        }
      }
    };
    this.barChartOptions = {
      ...this.barChartOptions,
      plugins: {
        ...this.barChartOptions.plugins,
        datalabels: {
          ...this.barChartOptions.plugins?.datalabels,
          formatter: (value, ctx) => this.currencyFormatPipe.transform(value)
        }
      }
    };
  }

  prepareCharts() {
    // Filter for current month
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    this.monthlyExpenses = this.expenses.filter(e => {
      let d: Date;
      if (e.date && typeof e.date.seconds === 'number') {
        d = new Date(e.date.seconds * 1000);
      } else {
        d = new Date(e.date);
      }
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const monthlyExpenses = this.monthlyExpenses;
    // Group helpers
    const groupSum = (arr: any[], key: string) => {
      const map = new Map<string, number>();
      arr.forEach(e => {
        const k = e[key] || 'Other';
        map.set(k, (map.get(k) || 0) + Number(e.value || 0));
      });
      return map;
    };
    // Donut: by Account (use names)
    const accMap = new Map<string, number>();
    monthlyExpenses.forEach(e => {
      const name = this.accountNameMap[e.accountUsed] || e.accountUsed || 'Other';
      accMap.set(name, (accMap.get(name) || 0) + Number(e.value || 0));
    });
    this.accountDonutData = {
      labels: Array.from(accMap.keys()),
      datasets: [{ data: Array.from(accMap.values()) }]
    };
    this.accountDonutTotal = Array.from(accMap.values()).reduce((a, b) => a + b, 0);
    // Donut: by Category (use names)
    const catMap = new Map<string, number>();
    monthlyExpenses.forEach(e => {
      const name = this.categoryNameMap[e.category] || e.category || 'Other';
      catMap.set(name, (catMap.get(name) || 0) + Number(e.value || 0));
    });
    this.categoryDonutData = {
      labels: Array.from(catMap.keys()),
      datasets: [{ data: Array.from(catMap.values()) }]
    };
    this.categoryDonutTotal = Array.from(catMap.values()).reduce((a, b) => a + b, 0);
    // Bar: by Date
    const dateMap = new Map<string, number>();
    monthlyExpenses.forEach(e => {
      let d: Date;
      if (e.date && typeof e.date.seconds === 'number') {
        d = new Date(e.date.seconds * 1000);
      } else {
        d = new Date(e.date);
      }
      const label = d.toLocaleDateString();
      dateMap.set(label, (dateMap.get(label) || 0) + Number(e.value || 0));
    });
    this.dateBarData = {
      labels: Array.from(dateMap.keys()),
      datasets: [{ data: Array.from(dateMap.values()), label: 'Total' }]
    };
    // Bar: by Description
    const descMap = groupSum(monthlyExpenses, 'description');
    this.descriptionBarData = {
      labels: Array.from(descMap.keys()),
      datasets: [{ data: Array.from(descMap.values()), label: 'Total' }]
    };
    // Bar: by Place
    const placeMap = groupSum(monthlyExpenses, 'place');
    this.placeBarData = {
      labels: Array.from(placeMap.keys()),
      datasets: [{ data: Array.from(placeMap.values()), label: 'Total' }]
    };

    setTimeout(() => {
      this.updateAccountDonutTotal();
      this.updateCategoryDonutTotal();
    });
  }

  updateAccountDonutTotal() {
    if (!this.accountDonutChart?.chart) return;
    const chart = this.accountDonutChart.chart;
    const data = chart.data.datasets[0].data as number[];
    this.accountDonutTotal = data.reduce((sum, val, idx) =>
      chart.getDataVisibility(idx) ? sum + (typeof val === 'number' ? val : 0) : sum, 0);
  }

  updateCategoryDonutTotal() {
    if (!this.categoryDonutChart?.chart) return;
    const chart = this.categoryDonutChart.chart;
    const data = chart.data.datasets[0].data as number[];
    this.categoryDonutTotal = data.reduce((sum, val, idx) =>
      chart.getDataVisibility(idx) ? sum + (typeof val === 'number' ? val : 0) : sum, 0);
  }

  onAccountDonutChartClick() {
    setTimeout(() => this.updateAccountDonutTotal());
  }

  onCategoryDonutChartClick() {
    setTimeout(() => this.updateCategoryDonutTotal());
  }

  get user() {
    return this.auth.currentUser;
  }

  // Sample doughnut chart data
  public doughnutChartLabels: string[] = ['Savings', 'Expenses', 'Investments'];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      { data: [350, 450, 200] }
    ]
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Account Distribution'
      }
    }
  };
}
