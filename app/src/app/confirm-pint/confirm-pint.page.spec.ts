import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmPintPage } from './confirm-pint.page';
import { commonTestConfig } from '../test-helpers/test-config';

describe('ConfirmPintPage', () => {
  let component: ConfirmPintPage;
  let fixture: ComponentFixture<ConfirmPintPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmPintPage],
      ...commonTestConfig
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmPintPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
