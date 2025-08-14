import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InitiatePintPage } from './initiate-pint.page';

describe('InitiatePintPage', () => {
  let component: InitiatePintPage;
  let fixture: ComponentFixture<InitiatePintPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InitiatePintPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
