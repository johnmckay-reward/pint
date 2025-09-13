import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-screen-reader-only',
  template: `<span class="sr-only" [attr.aria-label]="text" [attr.aria-describedby]="describedBy">{{ text }}</span>`,
  styles: [`
    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ScreenReaderOnlyComponent {
  @Input() text: string = '';
  @Input() describedBy?: string;
}