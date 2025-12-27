import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadDetailsPage } from './lead-details.page';

describe('LeadDetailsPage', () => {
  let component: LeadDetailsPage;
  let fixture: ComponentFixture<LeadDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
