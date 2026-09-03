import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FixedCostCalculatorPage } from './fixed-cost-calculator.page';

describe('FixedCostCalculatorPage', () => {
  let component: FixedCostCalculatorPage;
  let fixture: ComponentFixture<FixedCostCalculatorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FixedCostCalculatorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
