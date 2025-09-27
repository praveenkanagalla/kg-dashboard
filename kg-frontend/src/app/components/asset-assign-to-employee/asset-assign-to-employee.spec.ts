import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetAssignToEmployee } from './asset-assign-to-employee';

describe('AssetAssignToEmployee', () => {
  let component: AssetAssignToEmployee;
  let fixture: ComponentFixture<AssetAssignToEmployee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetAssignToEmployee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetAssignToEmployee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
