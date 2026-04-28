import { Component, HostListener, OnDestroy } from '@angular/core';
import { NotificationService, AppNotification } from '../core/notification.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent implements OnDestroy {

  isOpen = false;
  notifications: AppNotification[] = [];
  private destroy$ = new Subject<void>();

  constructor(public notifService: NotificationService, private router: Router) {
    this.notifService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => this.notifications = n);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.notifService.markAllRead();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const el = (e.target as HTMLElement).closest('.notif-wrapper');
    if (!el) this.isOpen = false;
  }

  navigate(notif: AppNotification): void {
    this.notifService.markRead(notif.id);
    if (notif.link) this.router.navigate([notif.link]);
    this.isOpen = false;
  }

  typeIcon(type: AppNotification['type']): string {
    switch (type) {
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-times-circle';
      default: return 'fas fa-info-circle';
    }
  }

  timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  }
}
