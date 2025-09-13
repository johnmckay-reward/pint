import { Injectable } from '@angular/core';

declare let gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  // Track page views
  trackPageView(pageTitle: string, pagePath: string) {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: pageTitle,
        page_location: window.location.origin + pagePath
      });
    }
  }

  // Track custom events
  trackEvent(eventName: string, parameters: any = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  }

  // Track user signup
  trackSignUp(method: string = 'email') {
    this.trackEvent('sign_up', {
      method: method,
      event_category: 'engagement'
    });
  }

  // Track user login
  trackLogin(method: string = 'email') {
    this.trackEvent('login', {
      method: method,
      event_category: 'engagement'
    });
  }

  // Track session creation
  trackSessionCreated(pubName: string) {
    this.trackEvent('create_session', {
      event_category: 'social',
      event_label: 'pint_session',
      pub_name: pubName
    });
  }

  // Track session joining
  trackSessionJoined(sessionId: string, pubName: string) {
    this.trackEvent('join_session', {
      event_category: 'social',
      event_label: 'pint_session',
      session_id: sessionId,
      pub_name: pubName
    });
  }

  // Track friend request sent
  trackFriendRequestSent() {
    this.trackEvent('send_friend_request', {
      event_category: 'social',
      event_label: 'friendship'
    });
  }

  // Track achievement earned
  trackAchievementEarned(achievementName: string) {
    this.trackEvent('earn_achievement', {
      event_category: 'gamification',
      event_label: achievementName,
      achievement_name: achievementName
    });
  }

  // Track subscription upgrade
  trackSubscriptionUpgrade(tier: string) {
    this.trackEvent('purchase', {
      event_category: 'subscription',
      event_label: tier,
      value: tier === 'plus' ? 4.99 : 0,
      currency: 'USD'
    });
  }

  // Track chat message sent
  trackChatMessage(sessionId: string) {
    this.trackEvent('send_message', {
      event_category: 'engagement',
      event_label: 'chat',
      session_id: sessionId
    });
  }

  // Track user profile update
  trackProfileUpdate() {
    this.trackEvent('update_profile', {
      event_category: 'engagement',
      event_label: 'profile'
    });
  }

  // Set user properties
  setUserProperties(userId: string, properties: any = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId,
        custom_map: properties
      });
    }
  }
}