import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceListPage } from './invoice-list.page';

describe('InvoiceListPage', () => {
  let component: InvoiceListPage;
  let fixture: ComponentFixture<InvoiceListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
