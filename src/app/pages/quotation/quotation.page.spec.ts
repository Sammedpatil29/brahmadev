import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuotationPage } from './quotation.page';

describe('QuotationPage', () => {
  let component: QuotationPage;
  let fixture: ComponentFixture<QuotationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuotationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
