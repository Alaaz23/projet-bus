import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Traget} from "../Model/Target";


@Injectable({
  providedIn: 'root'
})
export class TragetService {

  private apiUrl = 'http://localhost:8081/Bus-tracking/tragets';
  constructor(private http: HttpClient) { }

  getAllTragets(): Observable<Traget[]> {
    return this.http.get<Traget[]>(`${this.apiUrl}/getAll`);
  }
   getAll(): Observable<Traget[]> {
    return this.http.get<Traget[]>(`${this.apiUrl}/getAll`);
  }

  add(traget: Traget): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/add`, traget);
  }

  update(id: number, traget: Traget): Observable<number> {
    return this.http.put<number>(`${this.apiUrl}/update/${id}`, traget);
  }

  delete(id: number): Observable<number> {
    return this.http.delete<number>(`${this.apiUrl}/delete/${id}`);
  }

  count(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}
