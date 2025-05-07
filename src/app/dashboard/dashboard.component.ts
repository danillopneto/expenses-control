import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType, ChartOptions, ChartData, Chart, registerables } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';
import { FirebaseService } from '../shared/firebase.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables);
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    TranslateModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);
  expenses: any[] = [];
  public monthlyExpenses: any[] = [];
  accounts: any[] = [];
  categories: any[] = [];
  private accountNameMap: Record<string, string> = {};
  private categoryNameMap: Record<string, string> = {};

  // Chart data variables
  public accountDonutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  public categoryDonutData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  public dateBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };
  public descriptionBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };
  public placeBarData: ChartData<'bar'> = { labels: [], datasets: [{ data: [] }] };

  public donutChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      datalabels: {
        color: '#333',
        font: { weight: 'bold', size: 16 },
        anchor: 'end',
        align: 'end',
        formatter: (value) => typeof value === 'number' ? value : '',
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
