import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import * as GeoSearch from 'leaflet-geosearch';
import { GeoSearchControl,OpenStreetMapProvider } from 'leaflet-geosearch';
import { LatLngTuple, LatLngExpression, Control } from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private routeControls: L.Routing.Control[] = [];
  private routeStationsSelected: L.Routing.Control[] = [];
  searchQuery: string = '';
  suggestions: string[] = [];
  showSuggestions: boolean = false;
  tragetsList: any[] = [];
  traget:number|undefined;
  libelle :string | null | undefined;
  libelles: string[] = [];

  constructor(private http: HttpClient,private toastr: ToastrService) { }

  ngOnInit(): void {
    this.initMap();
    this.getAllTragets();
  }
  getAllTragets() {
    this.http.get<any[]>('http://localhost:8081/Bus-tracking/tragets/getAll')
      .subscribe(
        response => {
          console.log('Tragets récupérés avec succès', response);
          this.tragetsList = response;
        },
        error => {
          console.error('Erreur lors de la récupération des tragets', error);
        }
      );
  }

  private initMap(): void {
    this.map = L.map('map').setView([36.77, 10.18], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    //this.addSearchControl();

    this.map.on('click', (event) => {
      const latlng = event.latlng;
      console.log('Latitude:', latlng.lat);
      console.log('Longitude:', latlng.lng);
      this.addBusStopMarker(latlng);
      if (this.libelle !== null) {
      this.markers.push(L.marker(latlng).addTo(this.map!));
      console.log(this.libelle)
      }
      this.drawRoute();
      console.log(this.markers);
    });
  }

  onInputChange(): void {
    if (this.searchQuery.trim() !== '') {
      const searchProvider = new OpenStreetMapProvider();
      searchProvider.search({ query: this.searchQuery })
        .then((result: any) => {
          this.suggestions = result.map((item: any) => item.label);
          this.showSuggestions = true;
        })
        .catch((error: any) => {
          console.error('Error searching location:', error);
          this.showSuggestions = false;
        });
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }
  

selectSuggestion(suggestion: string): void {
  this.searchQuery = suggestion;
  this.showSuggestions = false;

  const searchProvider = new OpenStreetMapProvider();
  searchProvider.search({ query: suggestion })
    .then((result: any) => {
      if (result.length > 0) {
        const { x, y } = result[0];
        const position: LatLngTuple = [y, x];

        this.map!.flyTo(position, 12, {
          animate: true,
          duration: 1.5
        });
      }
    })
    .catch((error: any) => {
      console.error('Error searching location:', error);
    });
}
  onSearch(): void {
    const searchProvider = new OpenStreetMapProvider();
    searchProvider.search({ query: this.searchQuery })
      .then((result: any) => {
        if (result.length > 0) {
          const { x, y } = result[0];
          const position: LatLngTuple = [y, x];
          this.map!.flyTo(position, 12, {
            animate: true,
            duration: 1.5
          });
  
          this.addMarker(position);
        }
      })
      .catch((error: any) => {
        console.error('Error searching location:', error);
      });
  
    this.searchQuery = '';
    this.showSuggestions = false;
  }

  private addMarker(position: LatLngExpression): void {
    const marker = L.marker(position).addTo(this.map!)
      .bindPopup('Searched location')
      .openPopup();
  
    this.markers.push(marker);
  }

  /*private addSearchControl(): void {
    const searchProvider = new OpenStreetMapProvider();
    const searchControl = GeoSearch.GeoSearchControl({
      provider: searchProvider,
      showMarker: true,
      showPopup: true,
      autoClose: true,
      retainZoomLevel: true,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Enter address, place or street',
      placeholder: 'Search...',
      zoomLevel: 18,
      position: 'topleft',
      classNames: {
        container: 'search-container',
      },
    });
  
    const searchContainer = searchControl.getContainer();
  
    if (searchContainer) {
      searchContainer.classList.add('search-container');
    } else {
      console.log(searchControl);
      console.error('Search container not found.');
    }
  
    this.map!.addControl(searchControl);
  }
  */
  
  private addBusStopMarker(latlng: L.LatLng): void {
    this.libelle = prompt('Entrez un libellé pour la station:');
    if (this.libelle !== null ) {
      const index = this.libelles.length;
      this.libelles.splice(index, 0, this.libelle, "");
  console.log(this.libelles);
    const marker = L.marker(latlng).addTo(this.map!)
      .bindPopup('Bus stop')
      .openPopup();
    marker.on('click', () => {
      this.removeBusStopMarker(marker);
    });
    this.markers.push(marker);
  }
}


  private removeBusStopMarker(marker: L.Marker): void {
    this.map!.removeLayer(marker);
    this.markers = this.markers.filter(m => m !== marker);
  }

  private drawRoute(): void {
    if (this.markers.length >= 2) {
      const waypoints: L.Routing.Waypoint[] = this.markers.slice(1, -1).map(marker => ({
        latLng: marker.getLatLng(),
        name: ''
      }));

      const directions = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true
      }).addTo(this.map!);

      this.routeControls.push(directions);
    }
  }
  resetMarkers(): void {
    this.map!.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        this.map!.removeLayer(layer);
      }
    });

    this.routeControls.forEach(control => {
      this.map!.removeControl(control);
    });

    this.routeStationsSelected.forEach(control => {
      this.map!.removeControl(control);
    });

    this.routeControls = [];
    this.routeStationsSelected= [];
    this.markers = [];
  }
  removeLastMarkerAndRoute(): void {
    const lastMarker = this.markers.pop();
    const lastRouteControl = this.routeControls.pop();

    if (lastMarker && lastRouteControl) {
      this.map!.removeLayer(lastMarker);
      this.map!.removeControl(lastRouteControl);
      console.log(lastRouteControl);
      console.log(lastMarker);
    }
}
onSave(): void {
  var id_t:number|undefined;
  const libelle = prompt('Entrez un libellé pour la Traget:');
  if (libelle) {

    if (this.markers.length === 0) {
      this.toastr.warning('Aucune mark à enregistrer', 'Warning');  
      return;
    }
    else if(this.markers.length === 2){
      this.toastr.warning('Vous ne pouvez pas faire un traget avec 1 station', 'Warning');  
      return;
    }

    this.http.post('http://localhost:8081/Bus-tracking/tragets/add', {libelle})
    .subscribe(
      (response: any) => {
        id_t=response;

        for (let i = 0; i < this.markers.length; i += 2) {
          const marker = this.markers[i];
          const position = marker.getLatLng();
          const station = {
            libelle:this.libelles[i],
            traget: { id:id_t},
            longitude: position.lng,
            latitude: position.lat
          };

        this.http.post<any>('http://localhost:8081/Bus-tracking/stations/add', station)
        .subscribe(
          response => {
            console.log('Station enregistrée avec succès:', response);
            this.toastr.success('Traget et Station ajoutée', 'Success');
          },
          error => {
            console.error('Erreur lors de l\'enregistrement de la station:', error);
          }
        );
    };
    this.toastr.success('Traget et Stations ajoutée', 'Success');
      },
      error => {
        console.error('Erreur lors de l\'enregistrement du traget:', error)
        this.toastr.error('Traget et Station non ajoutée', 'Fail');
        ;
      }
    );
  }
  else{
    this.toastr.warning('Veuiller saisir le libelle du traget', 'Warning');  
  }
}

onSelectTraget() {
  if (this.traget) {
    this.http.get<any>(`http://localhost:8081/Bus-tracking/stations/by-traget/${this.traget}`)
      .subscribe(
        (response: any[]) => {
          console.log(response);
          this.displayMarkers(response);
        },
        error => {
          console.error('Erreur lors de la récupération des stations:', error);
        }
      );
  }
}

displayMarkers(stations: any[]) {
  if (!this.map) {
    this.map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  const markersByTraget: { [key: number]: L.Marker[] } = {};
  stations.forEach(station => {
    const key = station.traget.id;
    if (!markersByTraget[key]) {
      markersByTraget[key] = [];
    }

    const marker = L.marker([station.latitude, station.longitude]).addTo(this.map!);
    marker.bindPopup(`<b>${station.libelle}</b>`).openPopup();
    markersByTraget[key].push(marker);
  });

  Object.values(markersByTraget).forEach(markers => {
    if (markers.length > 1) {
      const waypoints: L.Routing.Waypoint[] = markers.map(marker => ({
        latLng: marker.getLatLng(),
        name: ''
      }));

      const directions = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: true
      }).addTo(this.map!);
      this.routeStationsSelected.push(directions);
    }
  });
}

}