import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChilkooruReport } from './chilkooru-report';

describe('ChilkooruReport', () => {
  let component: ChilkooruReport;
  let fixture: ComponentFixture<ChilkooruReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChilkooruReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChilkooruReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
