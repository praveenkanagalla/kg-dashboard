import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettlementReportTable } from './settlement-report-table';

describe('SettlementReportTable', () => {
  let component: SettlementReportTable;
  let fixture: ComponentFixture<SettlementReportTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettlementReportTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettlementReportTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
