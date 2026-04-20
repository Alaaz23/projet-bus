import { TestBed } from '@angular/core/testing';

import { TragetService } from './traget.service';

describe('TragetService', () => {
  let service: TragetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TragetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
