import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationPreferencesPage } from './notification-preferences.page';

describe('NotificationPreferencesPage', () => {
  let component: NotificationPreferencesPage;
  let fixture: ComponentFixture<NotificationPreferencesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationPreferencesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
