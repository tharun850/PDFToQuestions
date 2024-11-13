import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { examGuard } from './exam.guard';

describe('examGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => examGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
