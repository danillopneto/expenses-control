import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartType, ChartOptions, ChartData, Chart, registerables } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';

Chart.register(...registerables);

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
export class DashboardComponent {
  private auth = inject(Auth);
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
