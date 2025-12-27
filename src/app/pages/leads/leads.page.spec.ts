import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadsPage } from './leads.page';

describe('LeadsPage', () => {
  let component: LeadsPage;
  let fixture: ComponentFixture<LeadsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
