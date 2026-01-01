import { TestBed } from '@angular/core/testing';

import { Fcm } from './fcm';

describe('Fcm', () => {
  let service: Fcm;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fcm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
