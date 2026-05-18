import { Injectable, OnDestroy } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Service WebSocket STOMP — diffusion GPS temps réel.
 *
 * Utilisation :
 *   this.gpsWs.watchBus(6).subscribe(pos => { ... });
 *
 * L'Observable retourné :
 *   • s'abonne immédiatement si déjà connecté
 *   • se ré-abonne automatiquement en cas de reconnexion
 *   • se désabonne proprement quand l'appelant appelle .unsubscribe()
 *
 * Topic STOMP : /topic/gps/{busId}
 * Endpoint   : ws://localhost:8081/Bus-tracking/ws (SockJS)
 */
@Injectable({ providedIn: 'root' })
export class GpsWebSocketService implements OnDestroy {

  private client: Client;
  /** Émet un signal à chaque (re)connexion STOMP */
  private readonly connectSubject = new Subject<void>();

  constructor() {
    this.client = new Client({
      // SockJS factory — fallback automatique vers long-polling si WS bloqué
      webSocketFactory: () => new (SockJS as any)(`${environment.wsUrl}/ws`),
      reconnectDelay: 5000,
      // Désactiver les logs STOMP en console (mettre à true pour déboguer)
      debug: () => {},
    });

    this.client.onConnect    = () => this.connectSubject.next();
    this.client.onStompError = (frame) =>
      console.error('[GPS-WS] Erreur STOMP', frame.headers['message']);

    this.client.activate();
  }

  /**
   * Retourne un Observable qui émet les positions GPS du bus donné.
   * Se ré-abonne automatiquement si la connexion STOMP est rétablie.
   *
   * @param busId ID du bus à suivre
   */
  watchBus(busId: number): Observable<any> {
    return new Observable<any>((observer) => {
      let stompSub: StompSubscription | null = null;

      const doSubscribe = () => {
        stompSub = this.client.subscribe(`/topic/gps/${busId}`, (msg) => {
          try {
            observer.next(JSON.parse(msg.body));
          } catch (e) {
            console.error('[GPS-WS] Erreur parse JSON', e, msg.body);
          }
        });
      };

      // Abonnement immédiat si le client STOMP est déjà connecté
      if (this.client.connected) {
        doSubscribe();
      }

      // Ré-abonnement automatique à chaque reconnexion (réseau coupé, etc.)
      const reconnectSub: Subscription = this.connectSubject.subscribe(() => {
        stompSub?.unsubscribe();
        doSubscribe();
      });

      // Cleanup : appelé quand l'Observable est unsubscribed
      return () => {
        stompSub?.unsubscribe();
        reconnectSub.unsubscribe();
      };
    });
  }

  /**
   * Retourne un Observable qui émet les positions de TOUS les bus.
   * Utile pour un dashboard multi-bus.
   */
  watchAllBuses(): Observable<any> {
    return new Observable<any>((observer) => {
      let stompSub: StompSubscription | null = null;

      const doSubscribe = () => {
        stompSub = this.client.subscribe('/topic/gps/all', (msg) => {
          try {
            observer.next(JSON.parse(msg.body));
          } catch (e) {
            console.error('[GPS-WS] Erreur parse JSON (all)', e);
          }
        });
      };

      if (this.client.connected) doSubscribe();

      const reconnectSub: Subscription = this.connectSubject.subscribe(() => {
        stompSub?.unsubscribe();
        doSubscribe();
      });

      return () => {
        stompSub?.unsubscribe();
        reconnectSub.unsubscribe();
      };
    });
  }

  ngOnDestroy(): void {
    this.client.deactivate();
  }
}
