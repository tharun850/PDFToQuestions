import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamStarterComponent } from './exam-starter.component';

describe('ExamStarterComponent', () => {
  let component: ExamStarterComponent;
  let fixture: ComponentFixture<ExamStarterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamStarterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
