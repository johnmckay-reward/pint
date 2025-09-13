import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface PersonalizedContent {
  greeting: string;
  encouragement: string;
  timeContext: 'morning' | 'afternoon' | 'evening' | 'late';
}

@Injectable({
  providedIn: 'root'
})
export class PersonalizationService {
  private currentContent = new BehaviorSubject<PersonalizedContent>(this.generateContent());
  
  public content$ = this.currentContent.asObservable();

  constructor() {
    // Update content every 30 minutes to keep it fresh
    setInterval(() => {
      this.updateContent();
    }, 30 * 60 * 1000);
  }

  private generateContent(): PersonalizedContent {
    const now = new Date();
    const hour = now.getHours();
    
    let timeContext: PersonalizedContent['timeContext'];
    let greeting: string;
    let encouragement: string;

    if (hour >= 5 && hour < 12) {
      timeContext = 'morning';
      greeting = this.getRandomItem([
        'Good morning!',
        'Morning!',
        'Rise and shine!',
        'Top of the morning!'
      ]);
      encouragement = this.getRandomItem([
        'Perfect day to start something new',
        'Ready to make today great?',
        'The day is full of possibilities'
      ]);
    } else if (hour >= 12 && hour < 17) {
      timeContext = 'afternoon';
      greeting = this.getRandomItem([
        'Good afternoon!',
        'Afternoon!',
        'Hope your day is going well!',
        'Making progress today?'
      ]);
      encouragement = this.getRandomItem([
        'Time for a well-deserved break?',
        'How about a quick catch-up over drinks?',
        'Perfect time to unwind'
      ]);
    } else if (hour >= 17 && hour < 23) {
      timeContext = 'evening';
      greeting = this.getRandomItem([
        'Good evening!',
        'Evening!',
        'Ready for a pint this evening?',
        'Time to wind down?'
      ]);
      encouragement = this.getRandomItem([
        'Perfect time to catch up with friends',
        'End the day on a high note',
        'Ready to relax and socialize?'
      ]);
    } else {
      timeContext = 'late';
      greeting = this.getRandomItem([
        'Late one tonight?',
        'Still going strong!',
        'Night owl, eh?',
        'Up for a nightcap?'
      ]);
      encouragement = this.getRandomItem([
        'Perfect time for a quiet drink',
        'How about a late session?',
        'The night is still young'
      ]);
    }

    return { greeting, encouragement, timeContext };
  }

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  public updateContent(): void {
    this.currentContent.next(this.generateContent());
  }

  public getCurrentContent(): PersonalizedContent {
    return this.currentContent.value;
  }

  public getEmptyStateMessage(location?: string): string {
    const timeContext = this.getCurrentContent().timeContext;
    const locationName = location || 'your area';

    const messages = {
      morning: [
        `It's quiet in ${locationName} this morning...`,
        `Early bird in ${locationName}?`,
        `First one up in ${locationName}?`
      ],
      afternoon: [
        `Peaceful afternoon in ${locationName}...`,
        `Lunch break vibes in ${locationName}?`,
        `Quiet time in ${locationName}...`
      ],
      evening: [
        `It's quiet in ${locationName} right now...`,
        `Calm before the storm in ${locationName}?`,
        `Serene evening in ${locationName}...`
      ],
      late: [
        `All quiet in ${locationName} tonight...`,
        `Night owls in ${locationName} are rare...`,
        `Silent night in ${locationName}...`
      ]
    };

    return this.getRandomItem(messages[timeContext]);
  }

  public getEmptyStateAction(timeContext?: PersonalizedContent['timeContext']): string {
    const context = timeContext || this.getCurrentContent().timeContext;

    const actions = {
      morning: 'Start the first session of the day',
      afternoon: 'Break the afternoon silence', 
      evening: 'Get the evening started',
      late: 'Be the night owl pioneer'
    };

    return actions[context];
  }
}