import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { commonTestConfig } from '../test-helpers/test-config';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      ...commonTestConfig
    });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
