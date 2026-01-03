import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddLeadPage } from './add-lead.page';

describe('AddLeadPage', () => {
  let component: AddLeadPage;
  let fixture: ComponentFixture<AddLeadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLeadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
