import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewUser } from './create-new-user';

describe('CreateNewUser', () => {
  let component: CreateNewUser;
  let fixture: ComponentFixture<CreateNewUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNewUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNewUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
