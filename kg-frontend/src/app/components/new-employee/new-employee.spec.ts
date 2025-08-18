import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEmployee } from './new-employee';

describe('NewEmployee', () => {
  let component: NewEmployee;
  let fixture: ComponentFixture<NewEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEmployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEmployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
