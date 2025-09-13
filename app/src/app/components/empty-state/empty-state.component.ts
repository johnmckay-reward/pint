import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: []
})
export class EmptyStateComponent {
  @Input() icon: string = 'help-circle-outline';
  @Input() title: string = 'Nothing here yet';
  @Input() message: string = 'Check back later for updates.';
  @Input() actionText?: string;
  @Input() actionIcon?: string;
  @Input() showAction: boolean = false;

  onActionClick() {
    // Emit event or handle action - can be extended
  }
}