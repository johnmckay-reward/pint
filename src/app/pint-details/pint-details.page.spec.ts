import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PintDetailsPage } from './pint-details.page';

describe('PintDetailsPage', () => {
  let component: PintDetailsPage;
  let fixture: ComponentFixture<PintDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PintDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
