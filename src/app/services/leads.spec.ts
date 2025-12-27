import { TestBed } from '@angular/core/testing';

import { Leads } from './leads';

describe('Leads', () => {
  let service: Leads;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Leads);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
