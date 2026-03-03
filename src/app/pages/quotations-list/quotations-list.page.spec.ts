import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuotationsListPage } from './quotations-list.page';

describe('QuotationsListPage', () => {
  let component: QuotationsListPage;
  let fixture: ComponentFixture<QuotationsListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuotationsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
