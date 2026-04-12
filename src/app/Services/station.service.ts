import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Station} from "../Model/station";

@Injectable({
  providedIn: 'root'
})
export class StationService {

  private apiUrl = 'http://localhost:8081/Bus-tracking/stations';
  constructor(private http: HttpClient) { }

  getAllStations(): Observable<Station[]> {
    return this.http.get<Station[]>(`${this.apiUrl}/all`);
  }

  getStationById(id: number): Observable<Station> {
    return this.http.get<Station>(`${this.apiUrl}/${id}`);
  }

  addStation(station: Station): Observable<Station> {
    return this.http.post<Station>(`${this.apiUrl}/add`, station);
  }

  updateStation(id: number, station: Station): Observable<Station> {
    return this.http.put<Station>(`${this.apiUrl}/update/${id}`, station);
  }

  deleteStation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
