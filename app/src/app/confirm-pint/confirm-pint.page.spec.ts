import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmPintPage } from './confirm-pint.page';

describe('ConfirmPintPage', () => {
  let component: ConfirmPintPage;
  let fixture: ComponentFixture<ConfirmPintPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPintPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
