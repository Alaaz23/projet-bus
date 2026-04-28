import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly storageKey = 'busTracking.notifications';
  private readonly api = environment.apiUrl;

  private notifs$ = new BehaviorSubject<AppNotification[]>(this.load());
  readonly notifications$ = this.notifs$.asObservable();

  get unreadCount(): number {
    return this.notifs$.value.filter(n => !n.read).length;
  }

  get notifications(): AppNotification[] {
    return this.notifs$.value;
  }

  constructor(private http: HttpClient) {
    // Polling léger toutes les 30s pour détecter nouveaux feedbacks
    this.checkNewFeedbacks();
    setInterval(() => this.checkNewFeedbacks(), 30000);
  }

  push(title: string, message: string, type: AppNotification['type'] = 'info', link?: string): void {
    const notif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      link
    };
    const current = [notif, ...this.notifs$.value].slice(0, 20); // max 20
    this.notifs$.next(current);
    this.save(current);
  }

  markRead(id: string): void {
    const updated = this.notifs$.value.map(n => n.id === id ? { ...n, read: true } : n);
    this.notifs$.next(updated);
    this.save(updated);
  }

  markAllRead(): void {
    const updated = this.notifs$.value.map(n => ({ ...n, read: true }));
    this.notifs$.next(updated);
    this.save(updated);
  }

  clear(): void {
    this.notifs$.next([]);
    this.save([]);
  }

  private lastFeedbackCount = -1;

  private checkNewFeedbacks(): void {
    this.http.get<any[]>(`${this.api}/feedbacks/getAll`).subscribe({
      next: (feedbacks) => {
        const unread = feedbacks.filter(f => !f.checked).length;
        if (this.lastFeedbackCount >= 0 && unread > this.lastFeedbackCount) {
          const diff = unread - this.lastFeedbackCount;
          this.push(
            'Nouveau feedback',
            `${diff} nouveau(x) feedback(s) non lu(s) reçu(s)`,
            'info',
            '/feedbacks'
          );
        }
        this.lastFeedbackCount = unread;
      },
      error: () => {}
    });
  }

  private load(): AppNotification[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AppNotification[];
      return parsed.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
    } catch { return []; }
  }

  private save(notifs: AppNotification[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(notifs));
  }
}
