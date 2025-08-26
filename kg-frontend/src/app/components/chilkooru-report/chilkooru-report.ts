import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-chilkooru-report',
  imports: [DatePipe, CommonModule],
  templateUrl: './chilkooru-report.html',
  styleUrl: './chilkooru-report.css'
})
export class ChilkooruReport {

  today: Date = new Date();

  openingBalance: number = 0;
  grandTotal: number = 0;
  difference: number = 0;
  closingBalance: number = 0;
  amountDeposit: number = 0;

  denominations = [
    { note: 500, quantity: 0, total: 0 },
    { note: 200, quantity: 0, total: 0 },
    { note: 100, quantity: 0, total: 0 },
    { note: 50, quantity: 0, total: 0 },
    { note: 20, quantity: 0, total: 0 },
    { note: 10, quantity: 0, total: 0 },
    { note: 5, quantity: 0, total: 0 },
    { note: 2, quantity: 0, total: 0 },
    { note: 1, quantity: 0, total: 0 }
  ];

  grossSale = { actual: 0, system: 0, difference: 0 };
  swipe = { actual: 0, system: 0, difference: 0 };
  upi = { actual: 0, system: 0, difference: 0 };
  cash = { actual: this.getTodayCash(), system: 0, difference: 0 };
  totalGSOB = { actual: 0, system: 0, difference: 0 };

  // Calculate grand total
  getGrandTotal() {
    return this.denominations.reduce((sum, d) => sum + d.total, 0);
  }

  getTodayCash(): number {
    return this.getGrandTotal() - this.openingBalance;
  }

  getDifference(): number {
    return this.getGrandTotal() - this.getTodayCash();
  }

  // Function to recalc values
  updateGrossSale() {
    // Calculate differences for each row
    this.swipe.difference = this.swipe.actual - this.swipe.system;
    this.upi.difference = this.upi.actual - this.upi.system;
    this.cash.difference = this.getTodayCash() - this.cash.system;

    // Total actual & system = Gross Sale
    this.grossSale.actual = this.swipe.actual + this.upi.actual + this.getTodayCash();
    this.grossSale.system = this.swipe.system + this.upi.system + this.cash.system;

    // Gross Sale difference
    this.grossSale.difference = this.grossSale.actual - this.grossSale.system;

    // ✅ Calculate Total (GS + OB)
    this.totalGSOB.actual = this.openingBalance + this.grossSale.actual;
    this.totalGSOB.system = this.openingBalance + this.grossSale.system;
    this.totalGSOB.difference = this.totalGSOB.actual - this.totalGSOB.system;

    // Always calculate difference
    this.grossSale.difference = this.grossSale.actual - this.grossSale.system;

    // Recalculate Monthly Sale = Previous month + today’s Gross Sale
    this.monthlySale = this.previousMonthlySale + this.grossSale.actual;

  }

  updateTotals() {
    this.denominations.forEach(d => d.total = d.note * (d.quantity || 0));
    this.grandTotal = this.denominations.reduce((sum, d) => sum + d.total, 0);
    this.difference = this.grandTotal - this.openingBalance;
  }

  updateDeposit() {
    // Grand Total is already calculated from denominations table
    const grandTotal = this.getGrandTotal();

    // Formula: Deposit = Grand Total - Closing Balance
    this.amountDeposit = grandTotal - this.closingBalance;

    // Prevent negatives if Closing > GrandTotal
    if (this.amountDeposit < 0) {
      this.amountDeposit = 0;
    }
  }


  // start with 1 row
  expenses = [{ name: '', amount: 0 }];
  totalExpense = 0;

  addRow() {
    this.expenses.push({ name: '', amount: 0 });
  }

  updateTotal() {
    this.totalExpense = this.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }


  // monthlySale code
  monthlySale: number = 0;
  previousMonthlySale: number = 0; // fetched from backend

  ngOnInit() {
    this.loadPreviousMonthlySale();
  }

  // Example: pull monthly total till yesterday from backend
  loadPreviousMonthlySale() {
    // 🚀 Replace with API call
    this.previousMonthlySale = 0; // backend result
    this.updateGrossSale();
  }

}
