import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

interface Feedback {
  id: number;
  description: string;
  checked: boolean;
  time: string;
  salarie: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
  };
}

@Component({
  selector: 'app-feedback-management',
  templateUrl: './feedback-management.component.html',
  styleUrls: ['./feedback-management.component.css']
})
export class FeedbackManagementComponent implements OnInit {
  feedbacks: Feedback[] = [];
  isLoading = true;
  filter: 'all' | 'pending' | 'checked' = 'all';

  private readonly apiUrl = 'http://localhost:8081/Bus-tracking/feedbacks';

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    this.isLoading = true;
    this.http.get<Feedback[]>(`${this.apiUrl}/getAll`).subscribe({
      next: (data) => {
        this.feedbacks = data.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Impossible de charger les feedbacks.', 'Erreur');
        this.isLoading = false;
      }
    });
  }

  get filteredFeedbacks(): Feedback[] {
    if (this.filter === 'pending') return this.feedbacks.filter(f => !f.checked);
    if (this.filter === 'checked') return this.feedbacks.filter(f => f.checked);
    return this.feedbacks;
  }

  markAsChecked(feedback: Feedback): void {
    this.http
      .put<Feedback>(`${this.apiUrl}/${feedback.id}/check`, { checked: true })
      .subscribe({
        next: (updated) => {
          feedback.checked = updated.checked;
          this.toastr.success('Feedback marqué comme traité.', 'Succès');
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour.', 'Erreur');
        }
      });
  }

  get pendingCount(): number {
    return this.feedbacks.filter(f => !f.checked).length;
  }
}
