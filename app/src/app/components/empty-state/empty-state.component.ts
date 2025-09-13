import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PersonalizationService } from '../../services/personalization.service';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class EmptyStateComponent implements OnInit {
  private personalizationService = inject(PersonalizationService);

  @Input() icon: string = 'moon-outline';
  @Input() title?: string;
  @Input() message?: string;
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  @Input() showAction: boolean = true;
  @Input() location?: string;
  @Input() usePersonalization: boolean = true;

  @Output() actionClicked = new EventEmitter<void>();

  displayTitle: string = '';
  displayMessage: string = '';
  displayActionText: string = '';

  ngOnInit() {
    if (this.usePersonalization) {
      this.generatePersonalizedContent();
    } else {
      this.displayTitle = this.title || 'Nothing here yet';
      this.displayMessage = this.message || 'Check back later for updates.';
      this.displayActionText = this.actionText || 'Refresh';
    }
  }

  private generatePersonalizedContent(): void {
    const content = this.personalizationService.getCurrentContent();
    
    this.displayTitle = this.title || this.personalizationService.getEmptyStateMessage(this.location);
    this.displayMessage = this.message || 'Why not be the first to start a session?';
    this.displayActionText = this.actionText || this.personalizationService.getEmptyStateAction();
  }

  onActionClick() {
    this.actionClicked.emit();
  }
}