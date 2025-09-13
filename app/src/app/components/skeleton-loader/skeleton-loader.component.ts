import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonType = 'text' | 'avatar' | 'card' | 'list-item' | 'button';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() count: number = 1;
  @Input() width?: string;
  @Input() height?: string;
  @Input() animated: boolean = true;

  get skeletonItems(): number[] {
    return Array(this.count).fill(0).map((_, index) => index);
  }

  getSkeletonClass(): string {
    const baseClass = 'skeleton';
    const typeClass = `skeleton-${this.type}`;
    const animatedClass = this.animated ? 'skeleton-animated' : '';
    
    return [baseClass, typeClass, animatedClass].filter(c => c).join(' ');
  }

  getSkeletonStyle(): any {
    const style: any = {};
    
    if (this.width) {
      style.width = this.width;
    }
    
    if (this.height) {
      style.height = this.height;
    }
    
    return style;
  }

  trackByIndex(index: number): number {
    return index;
  }
}