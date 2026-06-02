import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import * as GeoSearch from 'leaflet-geosearch';
import { GeoSearchControl,OpenStreetMapProvider } from 'leaflet-geosearch';
import { LatLngTuple, LatLngExpression, Control } from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';
import { GpsWebSocketService } from '../Services/gps-websocket.service';
import { AuthService } from '../core/auth.service';

// Icône bus rotative — cercle blanc + icône bus bleue (style mobile Flutter)
function makeBusIcon(bearingDeg: number = 0): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:48px;height:48px;transform:rotate(${bearingDeg}deg);transform-origin:center;transition:transform 0.4s ease">
      <div style="width:48px;height:48px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.30)">
        <i class='bx bxs-bus' style='font-size:28px;color:#1a73e8;line-height:1;display:block'></i>
      </div>
    </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -26],
  });
}

// Icône fixe (pas de rotation) — départ et destination
const BUS_ICON = makeBusIcon(0);

// Marqueurs stations — taille mobile (28 px)
const DEPARTURE_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#00c853;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center">
    <i class='bx bx-radio-circle-marked' style='font-size:16px;color:#fff;line-height:1'></i>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const DESTINATION_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#e53935;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center">
    <i class='bx bx-flag' style='font-size:16px;color:#fff;line-height:1'></i>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// API OSRM (open source, gratuit)
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
// Valhalla — moteur de routing OSM qui supporte use_ferry:0 nativement
const VALHALLA_URL = 'https://valhalla1.openstreetmap.de/route';

// ── Trajet 1 : Borj Cedriya → Lac 1 (Berges du Lac) ───────────────────────
const EXACT_STATIONS: [number, number][] = [
  [36.705199, 10.407781],  //  1. Borj Cedriya (départ)
  [36.713843, 10.368674],  //  2. Hammem Chatt
  [36.727068, 10.336807],  //  3. Hammem Lif
  [36.736568, 10.313460],  //  4. Ezzahra lycée
  [36.740769, 10.302511],  //  5. Ezzahra ville
  [36.756550, 10.278947],  //  6. Radès
  [36.764836, 10.277623],  //  7. Pont Radès (côté est, approche pont)
  [36.772570, 10.287141],  //  8. Radès chatt (rive est du canal)
  [36.801808, 10.195353],  //  9. TGM (rive ouest — traverse via Pont de Radès)
  [36.809757, 10.193572],  // 10. Lac 0 (rive nord-ouest)
  [36.831374, 10.232228],  // 11. Lac 1 — Les Berges du Lac (arrivée)
];

// ── Trajet 2 : Ariana → Sofrecom ────────────────────────────────────────────
const ARIANA_SOFRECOM: [number, number][] = [
  [36.862000, 10.193500],  // 1. Ariana (départ)
  [36.849500, 10.198000],  // 2. Cité Ettadhamen
  [36.840200, 10.213000],  // 3. Centre Urbain Nord
  [36.831585, 10.232803],  // 4. Sofrecom (arrivée)
];

// ── Trajet 3 : Bizerte → Sofrecom ────────────────────────────────────────────
const BIZERTE_SOFRECOM: [number, number][] = [
  [37.269527,  9.874099],  // 1. Bizerte (départ)
  [37.264961,  9.885155],  // 2. Bizerte Zarzouna
  [36.831585, 10.232803],  // 3. Sofrecom (arrivée)
];

// Définition des circuits par bus ID
const BUS_ROUTES: {
  [busId: number]: {
    depName: string;
    destName: string;
    dest: [number, number];
    waypoints: [number, number][];
    stationNames: string[];
  }
} = {
  1: {
    depName: 'Borj Cedriya', destName: 'Lac 1 (Berges du Lac)',
    dest: [36.831374, 10.232228], waypoints: EXACT_STATIONS,
    stationNames: ['Borj Cedriya','Hammem Chatt','Hammem Lif','Ezzahra lycée','Ezzahra ville','Radès','Pont Radès','Radès chatt','TGM','Lac 0','Lac 1'],
  },
  6: {
    depName: 'Borj Cedriya', destName: 'Lac 1 (Berges du Lac)',
    dest: [36.831374, 10.232228], waypoints: EXACT_STATIONS,
    stationNames: ['Borj Cedriya','Hammem Chatt','Hammem Lif','Ezzahra lycée','Ezzahra ville','Radès','Pont Radès','Radès chatt','TGM','Lac 0','Lac 1'],
  },
  7: {
    depName: 'Ariana', destName: 'Sofrecom',
    dest: [36.831585, 10.232803], waypoints: ARIANA_SOFRECOM,
    stationNames: ['Ariana', 'Cité Ettadhamen', 'Centre Urbain Nord', 'Sofrecom'],
  },
  8: {
    depName: 'Bizerte', destName: 'Sofrecom',
    dest: [36.831585, 10.232803], waypoints: BIZERTE_SOFRECOM,
    stationNames: ['Bizerte', 'Bizerte Zarzouna', 'Sofrecom'],
  },
};

/** Type de la configuration de route (partagé web + mobile via /buses/{id}/route) */
type RouteConfig = typeof BUS_ROUTES[number];

/**
 * Routes pré-calculées OSRM — identiques aux points utilisés dans Flutter mobile.
 * Garantit un tracé identique sur les deux applications sans appel réseau.
 */
const PRECOMPUTED_ROUTES: { [busId: number]: [number, number][] } = {
  7: [
    [36.862049,10.193622],[36.861596,10.193906],[36.861766,10.194311],[36.861873,10.194568],[36.861966,10.194786],[36.862065,10.195036],
    [36.862263,10.195546],[36.86225,10.19555],[36.862238,10.195559],[36.86223,10.195573],[36.862227,10.19559],[36.862228,10.195607],
    [36.862235,10.195622],[36.861973,10.195828],[36.86184,10.195939],[36.861691,10.196063],[36.860866,10.196731],[36.860368,10.197104],
    [36.860337,10.197137],[36.860308,10.197181],[36.860281,10.197228],[36.860203,10.197358],[36.860119,10.197501],[36.86005,10.197514],
    [36.859594,10.197889],[36.859452,10.197903],[36.859413,10.197905],[36.859376,10.197897],[36.859348,10.197888],[36.85933,10.197875],
    [36.859316,10.197861],[36.8593,10.197841],[36.859298,10.197829],[36.859279,10.197757],[36.859248,10.197642],[36.859097,10.197079],
    [36.859044,10.197101],[36.859125,10.197453],[36.859115,10.197597],[36.859107,10.197629],[36.859096,10.197647],[36.859079,10.197659],
    [36.859046,10.197663],[36.859016,10.197659],[36.858929,10.197623],[36.85844,10.19742],[36.85712,10.196871],[36.856833,10.196686],
    [36.856669,10.196575],[36.856202,10.196251],[36.85593,10.19612],[36.85557,10.195992],[36.855349,10.195904],[36.855172,10.195888],
    [36.855166,10.195877],[36.855126,10.195836],[36.855076,10.195822],[36.855004,10.195859],[36.854925,10.195857],[36.853928,10.195836],
    [36.853671,10.195831],[36.85359,10.195827],[36.852695,10.195784],[36.852181,10.19575],[36.852038,10.195679],[36.851817,10.195657],
    [36.851676,10.195642],[36.85153,10.195621],[36.85148,10.195606],[36.851437,10.195574],[36.851402,10.19555],[36.851351,10.195515],
    [36.851306,10.195483],[36.851011,10.19546],[36.850927,10.195477],[36.850927,10.195566],[36.850922,10.195606],[36.850918,10.195694],
    [36.850936,10.195724],[36.850953,10.195851],[36.850956,10.195918],[36.850942,10.196009],[36.850922,10.196115],[36.850878,10.196225],
    [36.850838,10.196409],[36.850817,10.196694],[36.850748,10.196815],[36.850725,10.196875],[36.850718,10.196938],[36.850697,10.196946],
    [36.850558,10.19693],[36.849974,10.196793],[36.849952,10.19677],[36.849925,10.196757],[36.849896,10.196758],[36.849868,10.196772],
    [36.849844,10.196801],[36.849832,10.19684],[36.849833,10.196882],[36.849848,10.19692],[36.849857,10.196931],[36.849721,10.197795],
    [36.849682,10.198044],[36.849632,10.198366],[36.849533,10.199001],[36.849503,10.199088],[36.849463,10.199151],[36.849192,10.199395],
    [36.848509,10.200008],[36.847906,10.20053],[36.847861,10.200465],[36.847802,10.200422],[36.847734,10.200406],[36.847526,10.199875],
    [36.84722,10.199085],[36.847025,10.198625],[36.847077,10.198524],[36.8471,10.198407],[36.847091,10.198287],[36.847077,10.198234],
    [36.847055,10.198184],[36.846986,10.19809],[36.846896,10.198031],[36.846795,10.198015],[36.846449,10.197151],[36.846367,10.196949],
    [36.846268,10.196706],[36.846071,10.196225],[36.846085,10.196174],[36.846154,10.196061],[36.846202,10.195999],[36.846247,10.195944],
    [36.846389,10.195831],[36.847313,10.195212],[36.848049,10.194667],[36.84809,10.194641],[36.848117,10.194629],[36.848172,10.194608],
    [36.848241,10.194672],[36.848321,10.194704],[36.848405,10.194703],[36.848484,10.194667],[36.84853,10.194626],[36.848581,10.194548],
    [36.848597,10.194508],[36.848614,10.194439],[36.848616,10.194403],[36.848608,10.194302],[36.848658,10.194271],[36.848702,10.194242],
    [36.848758,10.194207],[36.84923,10.1939],[36.849325,10.193844],[36.849362,10.193823],[36.849408,10.193793],[36.849491,10.193746],
    [36.849522,10.193769],[36.849556,10.193781],[36.849568,10.193783],[36.849607,10.193781],[36.849644,10.193765],[36.849676,10.193738],
    [36.849712,10.193677],[36.849756,10.193629],[36.8498,10.193585],[36.850121,10.193351],[36.850217,10.193278],[36.850473,10.193086],
    [36.85058,10.193039],[36.850687,10.193014],[36.850779,10.193038],[36.850866,10.193078],[36.850925,10.193141],[36.850968,10.193215],
    [36.851019,10.193384],[36.851043,10.193503],[36.851081,10.193812],[36.8511,10.194165],[36.851146,10.195048],[36.851138,10.195681],
    [36.851095,10.196358],[36.851022,10.197075],[36.850924,10.197811],[36.850767,10.198722],[36.850744,10.199039],[36.850695,10.199368],
    [36.85025,10.201786],[36.850075,10.202652],[36.849958,10.203417],[36.849913,10.203676],[36.849541,10.205601],[36.849113,10.208421],
    [36.848733,10.210558],[36.848551,10.211525],[36.84839,10.212253],[36.848354,10.212419],[36.848309,10.212581],[36.848258,10.21274],
    [36.848199,10.212895],[36.848133,10.213046],[36.848061,10.213192],[36.847965,10.213338],[36.84787,10.213462],[36.847759,10.213578],
    [36.84764,10.213672],[36.847519,10.213751],[36.846561,10.214326],[36.846351,10.214446],[36.846224,10.214512],[36.846096,10.214573],
    [36.845966,10.214631],[36.845836,10.214684],[36.845704,10.214733],[36.845532,10.214791],[36.845358,10.214844],[36.845183,10.214888],
    [36.844988,10.214932],[36.844792,10.214967],[36.844594,10.214994],[36.844393,10.215011],[36.844174,10.215016],[36.843769,10.214992],
    [36.843692,10.214984],[36.843616,10.214972],[36.84354,10.214957],[36.842591,10.214727],[36.840812,10.214246],[36.839317,10.213814],
    [36.839059,10.213737],[36.838997,10.213677],[36.83894,10.213609],[36.838888,10.213535],[36.838842,10.213456],[36.838801,10.213372],
    [36.838785,10.21331],[36.838767,10.213249],[36.838746,10.213189],[36.83878,10.213204],[36.838807,10.213218],[36.838824,10.213235],
    [36.838842,10.213257],[36.838858,10.21328],[36.838941,10.213387],[36.838958,10.213403],[36.838978,10.213413],[36.839002,10.213422],
    [36.839024,10.213429],[36.839066,10.213433],[36.839143,10.213435],[36.839379,10.213451],[36.839551,10.213457],[36.83973,10.213462],
    [36.84006,10.213483],[36.840125,10.21349],[36.840166,10.213494],[36.840199,10.213498],[36.840276,10.213517],[36.840359,10.213541],
    [36.840854,10.213685],[36.840841,10.213777],[36.840818,10.213848],[36.840788,10.213916],[36.840751,10.213978],[36.840707,10.214033],
    [36.840659,10.21408],[36.839503,10.213788],[36.839456,10.213784],[36.839409,10.213787],[36.839362,10.213797],[36.839317,10.213814],
    [36.839059,10.213737],[36.838645,10.213624],[36.835821,10.212856],[36.835675,10.212805],[36.835606,10.212775],[36.835541,10.212738],
    [36.835478,10.212692],[36.83542,10.21264],[36.835389,10.212622],[36.835364,10.212611],[36.835316,10.212596],[36.835266,10.212589],
    [36.835216,10.21259],[36.835167,10.2126],[36.83511,10.212607],[36.834963,10.2126],[36.834805,10.212586],[36.83463,10.212566],
    [36.834456,10.212533],[36.834158,10.212444],[36.833719,10.212365],[36.832261,10.212098],[36.831907,10.212103],[36.831597,10.212135],
    [36.831278,10.212192],[36.831038,10.212259],[36.830816,10.212346],[36.830422,10.212492],[36.830332,10.212522],[36.830015,10.212661],
    [36.829789,10.212734],[36.829732,10.212697],[36.82967,10.212679],[36.829605,10.21268],[36.829543,10.212701],[36.829486,10.212741],
    [36.829439,10.212797],[36.829405,10.212866],[36.829382,10.212976],[36.829391,10.213088],[36.829429,10.21319],[36.829494,10.21327],
    [36.829576,10.213317],[36.829666,10.213326],[36.829773,10.2135],[36.829904,10.213699],[36.830031,10.213932],[36.830047,10.213964],
    [36.830136,10.214139],[36.830223,10.214345],[36.830338,10.214601],[36.830461,10.214881],[36.830569,10.215157],[36.830664,10.215385],
    [36.830839,10.21587],[36.831101,10.216602],[36.83109,10.216643],[36.831084,10.216686],[36.830765,10.216934],[36.830617,10.217055],
    [36.830534,10.217153],[36.830462,10.217317],[36.830117,10.218193],[36.82987,10.218848],[36.829832,10.218982],[36.82983,10.219112],
    [36.829845,10.219228],[36.830116,10.220301],[36.830381,10.221532],[36.830437,10.221828],[36.830474,10.222093],[36.830557,10.222709],
    [36.830607,10.223193],[36.830645,10.223557],[36.830658,10.223681],[36.830668,10.223805],[36.830704,10.224262],[36.830721,10.224691],
    [36.830723,10.225031],[36.830709,10.22532],[36.830685,10.225488],[36.830652,10.225688],[36.830604,10.225869],[36.83056,10.226013],
    [36.830534,10.226072],[36.830504,10.22614],[36.830421,10.22623],[36.830364,10.226256],[36.830316,10.226304],[36.830284,10.226369],
    [36.830272,10.226444],[36.83028,10.22652],[36.830259,10.226616],[36.830247,10.226717],[36.830231,10.226841],[36.830209,10.226939],
    [36.830178,10.227047],[36.830126,10.22721],[36.830087,10.227339],[36.830071,10.227414],[36.830066,10.227477],[36.830067,10.227553],
    [36.830075,10.227607],[36.830092,10.227645],[36.830115,10.227673],[36.830121,10.227693],[36.830545,10.229071],[36.830731,10.229675],
    [36.831086,10.230907],[36.831271,10.231553],[36.831298,10.231643],[36.831455,10.232161],[36.831633,10.232781],
  ],
};

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
  private map: L.Map | undefined;
  private markers: L.Marker[] = [];
  private routePolylines: L.Polyline[] = [];       // remplace L.Routing.Control (création circuit)
  private stationPolylines: L.Polyline[] = [];     // remplace L.Routing.Control (affichage circuit sauvegardé)
  searchQuery: string = '';
  suggestions: string[] = [];
  showSuggestions: boolean = false;
  tragetsList: any[] = [];
  traget: number | undefined;
  libelle: string | null | undefined;
  libelles: string[] = [];

  // ── GPS Tracking ──────────────────────────────────────────────
  busList: any[] = [];
  selectedBusId: number | null = null;
  gpsInfo: { lat: number; lng: number; speed: number; timestamp: string; busId: number } | null = null;
  trackingActive = false;
  noDataWarning = false;

  private gpsMarker: L.Marker | null = null;
  /** Abonnement WebSocket STOMP (remplace l'ancien polling HTTP) */
  private wsSubscription: Subscription | null = null;
  private lastBearing = 0;            // cap courant du bus (pour rotation icône)
  private lastGpsTimestamp = '';      // déduplicate les positions identiques

  // ── Route planifiée & ETA ──────────────────────────────────────
  etaInfo: { distKm: number; durationMin: number; arrivalTime: string; destName: string } | null = null;
  routeLoading = false;   // true pendant le calcul OSRM (affiché en UI)
  private plannedRouteLine: L.Polyline | null = null;
  private traveledLine: L.Polyline | null = null;  // chemin parcouru (rouge)
  private traveledPoints: L.LatLng[] = [];          // historique positions
  private stationMarkers: L.Marker[] = [];          // marqueurs arrêts
  private departureMarker: L.Marker | null = null;
  private destinationMarker: L.Marker | null = null;
  private lastEtaUpdate = 0;
  /** Points de la polyline calculée — utilisés pour snapper le marker sur la route */
  private routePoints: L.LatLng[] = [];
  /** Index courant dans routePoints pour la simulation automatique */
  private routeIndex = 0;
  /** setInterval de la simulation automatique (null = mode GPS réel actif) */
  private simInterval: any = null;
  /** true si une vraie donnée WebSocket est arrivée (désactive la simulation) */
  private realGpsActive = false;
  /** Position actuelle animée du marker (interp. entre deux updates GPS) */
  private currentMarkerPos: L.LatLng | null = null;
  /** ID requestAnimationFrame en cours (pour annulation propre) */
  private animFrameId: number | null = null;
  /** Dernière position GPS connue en base (fetchée au démarrage du suivi) */
  private lastKnownPos: L.LatLng | null = null;
  /** true quand le tab est caché — suspend le RAF sans l'annuler */
  private simPaused = false;
  /** Segment courant de la simulation (promo de variable locale → champ) */
  private simSegIdx = 0;
  /** Progression sur le segment courant [0..1] */
  private simSegT = 0;
  /** performance.now() au moment où le tab a été caché */
  private simPauseTime: number | null = null;
  /** Listener visibilitychange — stocké pour pouvoir le retirer dans ngOnDestroy */
  private visibilityListener = () => this.onVisibilityChange();

  // ── Suivi GPS passager (position réelle de l'utilisateur) ─────
  /** ID du watchPosition actif — null si suivi arrêté */
  private userWatchId: number | null = null;
  /** Marqueur bleu de la position utilisateur */
  private userMarker: L.Marker | null = null;
  /** Polyline verte du chemin parcouru par le passager */
  private userPolyline: L.Polyline | null = null;
  /** Historique des positions utilisateur */
  private userPositionPoints: L.LatLng[] = [];
  /** true quand le suivi GPS passager est actif */
  userLocationActive = false;
  /** Dernière erreur GPS passager (affichée en UI) */
  userLocationError: string | null = null;
  /** Dernière position GPS passager */
  userGpsInfo: { lat: number; lng: number; accuracy: number } | null = null;

  /** Configuration de route active — chargée depuis l'API backend ou BUS_ROUTES en fallback */
  private activeRouteConfig: RouteConfig | null = null;

  constructor(private http: HttpClient, private toastr: ToastrService, private gpsWs: GpsWebSocketService, private auth: AuthService) { }

  ngOnInit(): void {
    this.initMap();
    this.getAllTragets();
    this.loadBusList();
    document.addEventListener('visibilitychange', this.visibilityListener);
    // Auto-start tracking for salarie users who have a bus assigned
    const user = this.auth.currentUser;
    if (user && user.role === 'USER' && user.busId) {
      this.selectedBusId = user.busId;
      // Wait for map and bus list to be ready before starting tracking
      setTimeout(() => this.startTracking(), 500);
    }
  }

  ngOnDestroy(): void {
    this.stopTracking();
    this.stopUserTracking();
    document.removeEventListener('visibilitychange', this.visibilityListener);
  }

  /** Appelé automatiquement quand l'utilisateur change d'onglet ou revient */
  private onVisibilityChange(): void {
    if (document.hidden) {
      // Tab caché : marquer la pause ET enregistrer l'heure
      this.simPaused = true;
      this.simPauseTime = performance.now();
      console.log('[Visibility] 🙈 Tab caché — simulation suspendue');
    } else {
      // Tab visible : calculer le temps écoulé et avancer le bus
      this.simPaused = false;
      console.log('[Visibility] 👁 Tab visible — resynchronisation...');
      if (this.trackingActive && this.selectedBusId) {
        // 1. Fast-forward local (instantané, sans appel réseau)
        if (this.simPauseTime !== null && !this.realGpsActive && this.routePoints.length >= 2) {
          const missedMs = performance.now() - this.simPauseTime;
          this.fastForwardSimulation(missedMs);
        }
        this.simPauseTime = null;
        // 2. Resync depuis le backend uniquement en mode GPS réel
        // En mode simulation pure, resyncPosition() redémarre l'animation depuis
        // une position backend potentiellement ancienne → crée la ligne diagonale
        if (this.realGpsActive) {
          this.resyncPosition();
        }
      }
    }
  }

  /**
   * Avance instantanément la simulation de `missedMs` millisecondes.
   * Appelé quand l'onglet revient visible pour placer le bus où il serait
   * s'il avait continué à rouler pendant l'absence de l'utilisateur.
   */
  private fastForwardSimulation(missedMs: number): void {
    const SPEED_M_PER_S = 12;
    const pts = this.routePoints;
    if (pts.length < 2 || !this.gpsMarker) return;

    let remaining = SPEED_M_PER_S * missedMs / 1000; // mètres à parcourir
    while (remaining > 0 && this.simSegIdx < pts.length - 1) {
      const a = pts[this.simSegIdx];
      const b = pts[this.simSegIdx + 1];
      const segLen = a.distanceTo(b);
      if (segLen < 0.01) { this.simSegIdx++; this.simSegT = 0; continue; }
      const distToEnd = (1 - this.simSegT) * segLen;
      if (remaining >= distToEnd) {
        remaining -= distToEnd;
        this.traveledPoints.push(b); // ajouter le point de fin du segment parcouru
        this.simSegIdx++;
        this.simSegT = 0;
      } else {
        this.simSegT += remaining / segLen;
        remaining = 0;
      }
    }

    const idx = Math.min(this.simSegIdx, pts.length - 2);
    const a = pts[idx], b = pts[idx + 1];
    const lat = a.lat + (b.lat - a.lat) * this.simSegT;
    const lng = a.lng + (b.lng - a.lng) * this.simSegT;
    const pos = L.latLng(lat, lng);
    const bearing = this.calcBearing(a.lat, a.lng, b.lat, b.lng);

    this.currentMarkerPos = pos;
    this.lastKnownPos = pos;
    this.gpsMarker.setLatLng(pos);
    this.gpsMarker.setIcon(makeBusIcon(bearing));
    this.traveledPoints.push(pos);
    if (this.traveledLine) this.traveledLine.setLatLngs(this.traveledPoints);
    this.map?.panTo(pos, { animate: true, duration: 0.5 });

    console.log(`[SIM] ⚡ Fast-forward ${(missedMs / 1000).toFixed(1)}s → index ${this.simSegIdx}/${pts.length}`);
  }

  /**
   * Resynchronise le frontend avec la dernière position backend.
   * Appelé au retour sur l'onglet ET au démarrage du tracking.
   * → Corrige le "state mismatch" entre frontend et backend.
   */
  private resyncPosition(): void {
    if (!this.selectedBusId || !this.trackingActive) return;
    this.http.get<any>(`${environment.apiUrl}/gps/bus/${this.selectedBusId}/latest`).subscribe({
      next: (pos) => {
        if (!pos?.latitude || !pos?.longitude) return;
        const ageMs = Date.now() - new Date(pos.timestamp).getTime();
        if (ageMs > 600_000) {
          console.log('[Resync] Position trop ancienne (> 10 min) — ignorée');
          return;
        }
        const latLng = L.latLng(pos.latitude, pos.longitude);
        const bearing = pos.bearing ?? this.lastBearing;

        // 1. Snap sur la route si disponible
        const snapped = this.snapToRoute(latLng);

        // 2. Mettre à jour l'état interne
        this.lastKnownPos = snapped;
        this.currentMarkerPos = snapped;
        this.lastBearing = bearing;
        this.gpsInfo = {
          lat: pos.latitude, lng: pos.longitude,
          speed: pos.speed ?? 0, timestamp: pos.timestamp, busId: pos.busId,
        };

        // 3. Déplacer le marqueur directement (pas d'animation — on resynchronise)
        if (this.gpsMarker) {
          this.gpsMarker.setLatLng(snapped);
          this.gpsMarker.setIcon(makeBusIcon(bearing));
          this.gpsMarker.setPopupContent(this.buildPopupContent(pos));
        }

        // 4. Centrer la carte sur la nouvelle position
        this.map?.panTo(snapped, { animate: true, duration: 0.6 });

        // 5. Reprendre la simulation depuis le bon segment
        if (!this.realGpsActive && this.routePoints.length >= 2) {
          if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
          this.startSimulation();
        }

        console.log(`[Resync] ✅ Marker resynchronisé : ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)} (il y a ${Math.round(ageMs/1000)}s)`);
        this.toastr.info(`Position mise à jour (il y a ${Math.round(ageMs/1000)}s)`, 'GPS', { timeOut: 2500 });
      },
      error: () => console.warn('[Resync] Impossible de joindre le backend'),
    });
  }

  // ── Bus list for tracking selector (exclut HORS_SERVICE) ────────
  loadBusList(): void {
    this.http.get<any[]>(`${environment.apiUrl}/buses/getAll`).subscribe({
      next: (buses) => {
        this.busList = buses.filter(b =>
          b.statut?.toUpperCase() !== 'HORS_SERVICE'
        );
      },
      error: (err) => console.error('Erreur chargement bus:', err),
    });
  }

  /**
   * Charge la configuration de route depuis l'API backend (/buses/{id}/route).
   * Fallback sur BUS_ROUTES (hardcodé) si l'API échoue ou retourne des données insuffisantes.
   * Source de vérité commune avec l'application mobile Flutter.
   */
  private async loadBusRouteConfig(busId: number): Promise<RouteConfig | null> {
    try {
      const data: any = await this.http
        .get(`${environment.apiUrl}/buses/${busId}/route`)
        .toPromise();
      if (data?.waypoints?.length >= 2) {
        console.log(`[Route] Config chargée depuis API pour bus ${busId} : ${data.waypoints.length} stations`);
        return {
          depName:      data.depName,
          destName:     data.destName,
          dest:         [data.waypoints[data.waypoints.length - 1].lat,
                         data.waypoints[data.waypoints.length - 1].lng] as [number, number],
          waypoints:    (data.waypoints as any[]).map((w: any) => [w.lat, w.lng] as [number, number]),
          stationNames: (data.waypoints as any[]).map((w: any) => w.name as string),
        };
      }
    } catch (e) {
      console.warn(`[Route] API /buses/${busId}/route inaccessible — fallback hardcodé`, e);
    }
    const fallback = BUS_ROUTES[busId] ?? null;
    if (fallback) console.log(`[Route] Fallback BUS_ROUTES pour bus ${busId}`);
    return fallback;
  }

  // ── Start / Stop GPS tracking ─────────────────────────────────
  async startTracking(): Promise<void> {
    if (!this.selectedBusId) {
      this.toastr.warning('Sélectionnez un bus à suivre', 'GPS');
      return;
    }
    this.stopTracking();
    this.gpsInfo = null;
    this.noDataWarning = false;
    this.trackingActive = true;
    this.lastEtaUpdate = 0;
    this.etaInfo = null;
    this.lastGpsTimestamp = '';

    // Charger la configuration de route (API backend ou fallback hardcodé)
    this.activeRouteConfig = await this.loadBusRouteConfig(this.selectedBusId);
    const route = this.activeRouteConfig;

    // 1. Créer le marker bus AU POINT DE DÉPART — sera déplacé si position récente trouvée
    const [startLat, startLng] = route ? route.waypoints[0] : [36.705199, 10.407781];
    this.gpsMarker = L.marker([startLat, startLng], { icon: makeBusIcon(0) })
      .addTo(this.map!)
      .bindPopup(`<b>Bus ${this.selectedBusId}</b><br>🚏 ${route?.depName ?? 'Départ'}<br>⏳ Chargement de la position...`)
      .openPopup();

    // 2. Initialiser la ligne du chemin parcouru au point de départ
    this.traveledPoints = [L.latLng(startLat, startLng)];
    this.traveledLine = L.polyline(this.traveledPoints, {
      color: '#e53935', weight: 4, opacity: 0.85,
    }).addTo(this.map!);

    // 3. Récupérer la DERNIÈRE POSITION CONNUE en base — place le bus là où il est réellement
    this.lastKnownPos = null;
    this.http.get<any>(`${environment.apiUrl}/gps/bus/${this.selectedBusId}/latest`).subscribe({
      next: (pos) => {
        if (!pos?.latitude || !pos?.longitude) return;
        const ageMs = Date.now() - new Date(pos.timestamp).getTime();
        if (ageMs > 600_000) return; // ignorer si > 10 min
        const latLng = L.latLng(pos.latitude, pos.longitude);
        this.lastKnownPos = latLng;
        this.currentMarkerPos = latLng;
        if (this.gpsMarker) {
          const bearing = pos.bearing ?? 0;
          this.gpsMarker.setLatLng(latLng);
          this.gpsMarker.setIcon(makeBusIcon(bearing));
          this.gpsMarker.setPopupContent(this.buildPopupContent(pos));
          this.map?.panTo(latLng, { animate: true, duration: 0.8 });
          console.log(`[GPS-Init] ✅ Position initiale récupérée : ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)} (il y a ${Math.round(ageMs/1000)}s)`);
        }
        this.traveledPoints = [latLng];
        if (this.traveledLine) this.traveledLine.setLatLngs([latLng]);
      },
      error: () => console.log('[GPS-Init] Aucune position en base — simulation depuis le départ'),
    });

    // 4. Tracer le circuit planifié (direct + OSRM segment par segment)
    this.drawPlannedRoute(this.selectedBusId);

    // 4. Abonnement WebSocket STOMP — remplace le polling HTTP
    this.wsSubscription = this.gpsWs.watchBus(this.selectedBusId).subscribe({
      next: (pos) => {
        if (!pos) return;
        // Déduplique : ignorer si même timestamp
        if (pos.timestamp === this.lastGpsTimestamp) return;
        this.lastGpsTimestamp = pos.timestamp;
        // Ignorer données GPS plus anciennes que 2 min
        const age = Date.now() - new Date(pos.timestamp).getTime();
        if (age > 120_000) return;
        this.noDataWarning = false;
        this.onGpsData(pos);
      },
      error: (err) => {
        console.error('[GPS-WS] Erreur WebSocket:', err);
        this.noDataWarning = true;
      },
    });
  }

  /** Auto-détecte le bus qui envoie des données GPS et le sélectionne */
  autoDetectBus(): void {
    this.http.get<any>(`${environment.apiUrl}/gps/latest`).subscribe({
      next: (pos) => {
        if (pos && pos.busId) {
          this.selectedBusId = pos.busId;
          this.toastr.success(`Bus actif détecté : ID ${pos.busId}`, 'GPS');
          this.startTracking();
        } else {
          this.toastr.warning('Aucune donnée GPS reçue. Lancez la simulation.', 'GPS');
        }
      },
      error: () => {
        this.toastr.warning('Aucune donnée GPS reçue. Lancez la simulation.', 'GPS');
      },
    });
  }

  stopTracking(): void {
    if (this.wsSubscription) { this.wsSubscription.unsubscribe(); this.wsSubscription = null; }
    this.trackingActive = false;
    this.noDataWarning = false;
    this.etaInfo = null;
    this.routeLoading = false;
    this.lastBearing = 0;
    this.lastGpsTimestamp = '';
    this.traveledPoints = [];
    if (this.animFrameId !== null) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (this.simInterval !== null) { clearInterval(this.simInterval); this.simInterval = null; }
    this.routeIndex = 0;
    this.realGpsActive = false;
    this.lastKnownPos = null;
    this.simPaused = false;
    this.simSegIdx = 0;
    this.simSegT = 0;
    this.simPauseTime = null;
    if (this.plannedRouteLine)  { this.map!.removeLayer(this.plannedRouteLine);  this.plannedRouteLine = null; }
    if (this.traveledLine)      { this.map!.removeLayer(this.traveledLine);      this.traveledLine = null; }
    if (this.departureMarker)   { this.map!.removeLayer(this.departureMarker);   this.departureMarker = null; }
    if (this.destinationMarker) { this.map!.removeLayer(this.destinationMarker); this.destinationMarker = null; }
    if (this.gpsMarker)         { this.map!.removeLayer(this.gpsMarker);         this.gpsMarker = null; }
    this.stationMarkers.forEach(m => this.map!.removeLayer(m));
    this.stationMarkers = [];
    this.routePoints = [];
    this.currentMarkerPos = null;
    this.gpsInfo = null;
  }

  /** Trace la route planifiée pour le busId donné */
  private drawPlannedRoute(busId: number): void {
    const route = this.activeRouteConfig;
    if (!route) return;

    // ── 1. Marqueurs des stations ────────────────────────────────────────────
    route.waypoints.forEach(([lat, lng], idx) => {
      const isFirst = idx === 0;
      const isLast  = idx === route.waypoints.length - 1;
      const icon = isFirst ? DEPARTURE_ICON : isLast ? DESTINATION_ICON : L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:#ff8f00;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const name  = route.stationNames[idx] ?? `Arrêt ${idx + 1}`;
      const label = isFirst ? `🚏 Départ — ${name}` : isLast ? `🏁 Arrivée — ${name}` : `🚌 ${name}`;
      const m = L.marker([lat, lng], { icon }).addTo(this.map!).bindPopup(`<b>${label}</b>`);
      this.stationMarkers.push(m);
    });

    // ── 2. Centrer la carte sur toutes les stations ──────────────────────────
    const stationBounds = L.latLngBounds(route.waypoints.map(([lat, lng]) => L.latLng(lat, lng)));
    this.map!.fitBounds(stationBounds, { padding: [60, 60] });

    // ── 3. Calcul Valhalla/OSRM — route réelle uniquement ────────────────────
    // Priorité 0 : route pré-calculée (identique à Flutter mobile, aucun appel réseau)
    const precomputed = PRECOMPUTED_ROUTES[busId];
    if (precomputed?.length >= 2) {
      const allLatLngs = precomputed.map(([lat, lng]) => L.latLng(lat, lng));
      this.routePoints = allLatLngs;
      this.routeIndex = 0;
      if (this.plannedRouteLine) this.map!.removeLayer(this.plannedRouteLine);
      this.plannedRouteLine = L.polyline(allLatLngs, {
        color: '#1a73e8', weight: 5, opacity: 0.85,
      }).addTo(this.map!);
      this.map!.fitBounds(this.plannedRouteLine.getBounds(), { padding: [60, 60] });
      this.startSimulation();
      return;
    }

    this.routeLoading = true;
    this.fetchOsrmRoute(route.waypoints).then(allLatLngs => {
      this.routeLoading = false;
      if (!allLatLngs.length) return;
      this.routePoints = allLatLngs;
      this.routeIndex = 0;
      if (this.plannedRouteLine) this.map!.removeLayer(this.plannedRouteLine);
      this.plannedRouteLine = L.polyline(allLatLngs, {
        color: '#1a73e8', weight: 5, opacity: 0.85,
      }).addTo(this.map!);
      this.map!.fitBounds(this.plannedRouteLine.getBounds(), { padding: [60, 60] });

      // Démarrer la simulation automatique si pas de données WebSocket
      this.startSimulation();
    });
  }

  /**
   * Décode un polyline encodé (format Google / Valhalla, précision 6)
   * en liste de LatLng Leaflet.
   */
  private decodePolyline(encoded: string): L.LatLng[] {
    const result: L.LatLng[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let b: number, shift = 0, n = 0;
      do { b = encoded.charCodeAt(index++) - 63; n |= (b & 31) << shift; shift += 5; } while (b >= 32);
      lat += (n & 1) ? ~(n >> 1) : (n >> 1);
      shift = 0; n = 0;
      do { b = encoded.charCodeAt(index++) - 63; n |= (b & 31) << shift; shift += 5; } while (b >= 32);
      lng += (n & 1) ? ~(n >> 1) : (n >> 1);
      result.push(L.latLng(lat / 1e6, lng / 1e6));
    }
    return result;
  }

  /**
   * Calcule la route réelle via Valhalla (primaire) puis OSRM (fallback).
   *
   * ① Valhalla (valhalla1.openstreetmap.de) — use_ferry:0 empêche le ferry du TGM
   * ② OSRM sans exclude=ferry (fallback si Valhalla inaccessible)
   * ③ Lignes directes via ROUTING_WAYPOINTS (pont inclus) — dernier recours visible
   */
  private async fetchOsrmRoute(routingWps: [number, number][]): Promise<L.LatLng[]> {

    // ─────────────────────────────────────────────────────────────────────────
    // ① Valhalla — moteur de routing qui interdit les ferries nativement
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const body = {
        // Départ et arrivée = "break" (arrêt complet), stations intermédiaires = "through"
        // "through" évite les demi-tours et boucles aux stations intermédiaires
        locations: routingWps.map(([lat, lon], i) => ({
          lat, lon,
          type: (i === 0 || i === routingWps.length - 1) ? 'break' : 'through',
        })),
        costing: 'auto',
        costing_options: { auto: { use_ferry: 0.0, ferry_cost: 9999 } },
      };
      const res = await Promise.race([
        this.http.post<any>(VALHALLA_URL, body).toPromise(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('valhalla timeout')), 12000)),
      ]);
      const legs: any[] = (res as any)?.trip?.legs ?? [];
      const all: L.LatLng[] = [];
      for (let i = 0; i < legs.length; i++) {
        const pts = this.decodePolyline(legs[i].shape);
        if (i > 0 && pts.length) pts.shift(); // éviter doublon de jonction
        all.push(...pts);
      }
      if (all.length >= 2) {
        console.log(`[Valhalla] ✅ Route sans ferry : ${all.length} points`);
        return all;
      }
    } catch (e) {
      console.warn('[Valhalla] Échec — fallback OSRM', e);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ② OSRM — sans exclude=ferry (évite les "no route" qui causaient le fallback)
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const coordStr = routingWps.map(([lat, lng]) => `${lng},${lat}`).join(';');
      const radiuses = routingWps.map(() => '500').join(';');
      const osrmUrl = `${OSRM_URL}/${coordStr}?overview=full&geometries=geojson&radiuses=${radiuses}`;
      const res = await Promise.race([
        this.http.get<any>(osrmUrl).toPromise(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('osrm timeout')), 10000)),
      ]);
      const coords = (res as any)?.routes?.[0]?.geometry?.coordinates;
      if (coords?.length >= 2) {
        console.log(`[OSRM] ✅ Route : ${coords.length} points`);
        return (coords as [number, number][]).map(([lng, lat]) => L.latLng(lat, lng));
      }
    } catch (e) {
      console.warn('[OSRM] Échec — fallback lignes directes via points pont', e);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ③ Fallback visible — lignes directes via ROUTING_WAYPOINTS (pont de Radès inclus)
    //    Chaque segment est ≤1.5 km → aucun ne traverse le lac directement
    // ─────────────────────────────────────────────────────────────────────────
    console.warn('[Route] ⚠️ Valhalla + OSRM inaccessibles — polyline de secours (via pont)');
    return routingWps.map(([lat, lng]) => L.latLng(lat, lng));
  }

  /** Calcule l'ETA localement depuis la position courante sur la route (throttlé 5 s) */
  private updateETA(): void {
    const route = this.activeRouteConfig;
    if (!route || !this.selectedBusId) return;
    const pts = this.routePoints;
    if (pts.length < 2) return;

    const now = Date.now();
    if (now - this.lastEtaUpdate < 5_000) return;
    this.lastEtaUpdate = now;

    // ── 1. Distance restante sur la route ────────────────────────
    let remainingM = 0;
    if (this.simSegIdx < pts.length - 1) {
      const segLen = pts[this.simSegIdx].distanceTo(pts[this.simSegIdx + 1]);
      remainingM += segLen * (1 - this.simSegT);
      for (let i = this.simSegIdx + 1; i < pts.length - 1; i++) {
        remainingM += pts[i].distanceTo(pts[i + 1]);
      }
    }

    if (remainingM <= 0) {
      this.etaInfo = null;
      return;
    }

    // ── 2. Vitesse effective ──────────────────────────────────────
    const SPEED_M_PER_S = 12; // simulation : 43.2 km/h
    const effectiveSpeed = (this.realGpsActive && this.gpsInfo && this.gpsInfo.speed > 2)
      ? this.gpsInfo.speed / 3.6   // vitesse GPS réelle km/h → m/s
      : SPEED_M_PER_S;

    // ── 3. Calcul ETA ─────────────────────────────────────────────
    const durationSec = remainingM / effectiveSpeed;
    const durationMin = Math.ceil(durationSec / 60);
    const distKm = Math.round(remainingM / 100) / 10;
    const arrivalDate = new Date(Date.now() + durationSec * 1000);
    this.etaInfo = {
      distKm,
      durationMin,
      arrivalTime: arrivalDate.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' }),
      destName: route.destName,
    };
  }

  private onGpsData(pos: any): void {
    const newLat: number = pos.latitude;
    const newLng: number = pos.longitude;

    // Cap : priorité au bearing envoyé par le simulateur, sinon calculé depuis position précédente
    let newBearing: number = this.lastBearing;
    if (pos.bearing != null && pos.bearing > 0) {
      newBearing = pos.bearing;
    } else if (this.gpsInfo) {
      const b = this.calcBearing(this.gpsInfo.lat, this.gpsInfo.lng, newLat, newLng);
      if (b > 0) newBearing = b;  // ignorer cap nul (pas de mouvement)
    }
    this.lastBearing = newBearing;

    this.gpsInfo = {
      lat: newLat, lng: newLng,
      speed: pos.speed ?? 0,
      timestamp: pos.timestamp,
      busId: pos.busId,
    };

    // Première donnée réelle : stopper la simulation automatique
    if (!this.realGpsActive) {
      this.realGpsActive = true;
      if (this.simInterval !== null) { clearInterval(this.simInterval); this.simInterval = null; }
    }

    const rawLatLng = L.latLng(newLat, newLng);
    // Snapper la position GPS sur la polyline de route (±150 m max)
    const snappedLatLng = this.snapToRoute(rawLatLng);

    // ── Déplacer le marker bus : animation fluide de la position courante vers snappée ──
    const fromPos = this.currentMarkerPos ?? snappedLatLng;
    if (this.gpsMarker) {
      this.gpsMarker.setIcon(makeBusIcon(newBearing));
      this.gpsMarker.setPopupContent(this.buildPopupContent(pos));
      this.animateMarker(fromPos, snappedLatLng, newBearing);
    } else {
      this.gpsMarker = L.marker(snappedLatLng, { icon: makeBusIcon(newBearing) })
        .addTo(this.map!).bindPopup(this.buildPopupContent(pos));
      this.currentMarkerPos = snappedLatLng;
    }

    // ── Chemin parcouru (ligne rouge qui s'allonge) ───────────────────────────
    this.traveledPoints.push(snappedLatLng);
    if (this.traveledLine) {
      this.traveledLine.setLatLngs(this.traveledPoints);
    }

    // ── Centrer la carte seulement si le bus sort des 40% centraux de la vue ──
    if (this.map) {
      const bounds = this.map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const marginLat = (ne.lat - sw.lat) * 0.3;
      const marginLng = (ne.lng - sw.lng) * 0.3;
      const innerBounds = L.latLngBounds(
        [sw.lat + marginLat, sw.lng + marginLng],
        [ne.lat - marginLat, ne.lng - marginLng]
      );
      if (!innerBounds.contains(snappedLatLng)) {
        this.map.panTo(snappedLatLng, { animate: true, duration: 0.6 });
      }
    }

    this.updateETA();
  }


  /**
   * Simulation automatique 100% requestAnimationFrame — aucun setInterval.
   *
   * Principe : on interpole en continu de routePoints[i] vers routePoints[i+1]
   * à une vitesse constante (SPEED_M_PER_S mètres/seconde).
   * → Mouvement parfaitement fluide, jamais de saut, jamais de doublon d'interval.
   * → Stoppe proprement si realGpsActive=true ou si trackingActive=false.
   */
  private startSimulation(): void {
    // Nettoyage de toute simulation précédente
    if (this.animFrameId !== null) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (this.simInterval !== null) { clearInterval(this.simInterval); this.simInterval = null; }

    const pts = this.routePoints;
    if (pts.length < 2 || !this.gpsMarker) {
      console.warn('[SIM] routePoints vide ou marker absent — simulation annulée');
      return;
    }

    const SPEED_M_PER_S = 12; // ≈ 43 km/h (vitesse bus urbain)
    let lastTime: number | null = null;

    // Trouver le segment de départ : si on a une position connue, chercher le point le plus proche
    this.simSegIdx = 0;
    this.simSegT = 0;
    if (this.lastKnownPos) {
      let bestDist = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = pts[i].distanceTo(this.lastKnownPos);
        if (d < bestDist) { bestDist = d; this.simSegIdx = i; }
      }
      console.log(`[SIM] ▶ Reprise depuis l'index ${this.simSegIdx}/${pts.length} (position connue)`);
    } else {
      console.log(`[SIM] ▶ Démarrage depuis le début — ${pts.length} points, vitesse ${SPEED_M_PER_S} m/s`);
    }

    // Placer le bus à sa position de départ
    const startPt = this.lastKnownPos ?? pts[0];
    this.gpsMarker.setLatLng(startPt);
    this.currentMarkerPos = startPt;
    if (!this.lastKnownPos) {
      this.traveledPoints = [startPt];
      if (this.traveledLine) this.traveledLine.setLatLngs([startPt]);
    }

    const tick = (timestamp: number) => {
      // Conditions d'arrêt
      if (this.realGpsActive || !this.trackingActive || !this.gpsMarker) {
        console.log('[SIM] ⏹ Arrêt (GPS réel ou tracking stoppé)');
        this.animFrameId = null;
        return;
      }
      // Tab caché : le tick continue à tourner mais ne bouge pas le bus
      // (fastForwardSimulation s'en chargera au retour)
      if (this.simPaused) {
        this.animFrameId = requestAnimationFrame(tick);
        return;
      }
      if (this.simSegIdx >= pts.length - 1) {
        console.log('[SIM] 🏁 Fin de trajet');
        this.gpsMarker.setLatLng(pts[pts.length - 1]);
        this.gpsMarker.setPopupContent(`<b>Bus ${this.selectedBusId}</b><br>🏁 Arrivée`);
        this.animFrameId = null;
        return;
      }

      // Calculer le delta temps
      if (lastTime === null) { lastTime = timestamp; }
      const dtMs = Math.min(timestamp - lastTime, 200); // cap à 200ms pour éviter les sauts
      lastTime = timestamp;

      // Distance à parcourir ce frame
      const distThisFrame = SPEED_M_PER_S * dtMs / 1000;

      // Avancer sur les segments jusqu'à épuiser la distance de ce frame
      let remaining = distThisFrame;
      while (remaining > 0 && this.simSegIdx < pts.length - 1) {
        const a = pts[this.simSegIdx];
        const b = pts[this.simSegIdx + 1];
        const segLen = a.distanceTo(b);
        if (segLen < 0.01) { this.simSegIdx++; this.simSegT = 0; continue; }

        const distToEnd = (1 - this.simSegT) * segLen;
        if (remaining >= distToEnd) {
          remaining -= distToEnd;
          this.simSegIdx++;
          this.simSegT = 0;
        } else {
          this.simSegT += remaining / segLen;
          remaining = 0;
        }
      }

      // Position interpolée courante
      const clampedIdx = Math.min(this.simSegIdx, pts.length - 2);
      const a   = pts[clampedIdx];
      const b   = pts[clampedIdx + 1];
      const lat = a.lat + (b.lat - a.lat) * this.simSegT;
      const lng = a.lng + (b.lng - a.lng) * this.simSegT;
      const pos = L.latLng(lat, lng);

      // Bearing pour orienter l'icône
      const bearing = this.calcBearing(a.lat, a.lng, b.lat, b.lng);

      // Déplacer le marker (setLatLng direct — pas d'animateMarker imbriqué)
      this.gpsMarker.setLatLng(pos);
      this.gpsMarker.setIcon(makeBusIcon(bearing));
      this.currentMarkerPos = pos;

      // Allonger la ligne parcourue
      this.traveledPoints.push(pos);
      if (this.traveledLine) this.traveledLine.setLatLngs(this.traveledPoints);

      // Re-centrer la carte si nécessaire
      if (this.map) {
        const bounds = this.map.getBounds();
        const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
        const mLat = (ne.lat - sw.lat) * 0.25, mLng = (ne.lng - sw.lng) * 0.25;
        const inner = L.latLngBounds([sw.lat + mLat, sw.lng + mLng], [ne.lat - mLat, ne.lng - mLng]);
        if (!inner.contains(pos)) this.map.panTo(pos, { animate: true, duration: 0.5 });
      }

      // ETA en temps réel (throttlé dans updateETA)
      this.updateETA();

      // Prochain frame
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Snap-to-route : trouve le point le plus proche sur la polyline de route.
   * Si la position GPS est à plus de 150 m de la route (hors trajet), retourne
   * la position brute pour ne pas déplacer le marker de façon absurde.
   */
  private snapToRoute(raw: L.LatLng): L.LatLng {
    if (this.routePoints.length < 2) return raw;
    let bestDist = Infinity;
    let bestPt   = raw;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const pt = this.closestPointOnSegment(raw, this.routePoints[i], this.routePoints[i + 1]);
      const d  = raw.distanceTo(pt);
      if (d < bestDist) { bestDist = d; bestPt = pt; }
    }
    return bestDist <= 150 ? bestPt : raw;
  }

  /** Projette le point P sur le segment [A, B] (en coordonnées planes approx.) */
  private closestPointOnSegment(p: L.LatLng, a: L.LatLng, b: L.LatLng): L.LatLng {
    const ax = a.lng, ay = a.lat, bx = b.lng, by = b.lat, px = p.lng, py = p.lat;
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return a;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return L.latLng(ay + t * dy, ax + t * dx);
  }

  /**
   * Anime le marker bus de `from` vers `to` en ~900 ms (requestAnimationFrame).
   * Utilise une easing linéaire — suffisant pour un bus (pas un avion).
   */
  private animateMarker(from: L.LatLng, to: L.LatLng, bearing: number, durationMs = 900): void {
    if (this.animFrameId !== null) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }
    if (!this.gpsMarker) return;
    const startTime = performance.now();
    const step = (now: number) => {
      if (!this.gpsMarker) return;
      const t   = Math.min((now - startTime) / durationMs, 1);
      const lat = from.lat + (to.lat - from.lat) * t;
      const lng = from.lng + (to.lng - from.lng) * t;
      const pos = L.latLng(lat, lng);
      this.gpsMarker.setLatLng(pos);
      this.currentMarkerPos = pos;
      if (t < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.animFrameId = null;
        this.currentMarkerPos = to;
      }
    };
    this.animFrameId = requestAnimationFrame(step);
  }

  /** Calcule le cap en degrés entre deux points GPS */
  private calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => d * Math.PI / 180;
    const phi1 = toRad(lat1), phi2 = toRad(lat2);
    const dl   = toRad(lng2 - lng1);
    const x    = Math.sin(dl) * Math.cos(phi2);
    const y    = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl);
    return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
  }

  private buildPopupContent(pos: any): string {
    const ts = new Date(pos.timestamp).toLocaleTimeString('fr-TN');
    return `<b>Bus ${pos.busId}</b><br>
            📍 ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}<br>
            🚌 ${pos.speed?.toFixed(1) ?? '–'} km/h<br>
            🕐 ${ts}`;
  }
  // ── Suivi GPS passager ────────────────────────────────────────

  /**
   * Démarre le suivi GPS de la position réelle du passager via l'API
   * navigator.geolocation.watchPosition() du navigateur.
   * Met à jour le marqueur bleu et trace le chemin parcouru.
   */
  startUserTracking(): void {
    if (!('geolocation' in navigator)) {
      this.toastr.error('GPS non disponible sur cet appareil', 'Ma Position');
      console.error('[User-GPS] ❌ navigator.geolocation non supporté');
      return;
    }
    if (this.userLocationActive) {
      this.stopUserTracking();
      return;
    }
    this.userLocationActive = true;
    this.userLocationError = null;
    this.userGpsInfo = null;
    console.log('[User-GPS] 🔵 Démarrage du suivi de position passager...');

    this.userWatchId = navigator.geolocation.watchPosition(
      (pos) => this.onUserLocationUpdate(pos),
      (err) => this.onUserLocationError(err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    console.log(`[User-GPS] 📡 watchId=${this.userWatchId} — attente signal GPS...`);
  }

  /** Arrête le suivi GPS passager et nettoie la carte */
  stopUserTracking(): void {
    if (this.userWatchId !== null) {
      navigator.geolocation.clearWatch(this.userWatchId);
      this.userWatchId = null;
      console.log('[User-GPS] ⬛ watchPosition annulé');
    }
    this.userLocationActive = false;
    this.userGpsInfo = null;
    if (this.userMarker)   { this.map?.removeLayer(this.userMarker);   this.userMarker = null; }
    if (this.userPolyline) { this.map?.removeLayer(this.userPolyline); this.userPolyline = null; }
    this.userPositionPoints = [];
    console.log('[User-GPS] 🧹 Marqueur et tracé supprimés');
  }

  /**
   * Callback déclenché à chaque nouvelle position GPS passager.
   * Crée ou met à jour le marqueur bleu et la polyline verte.
   */
  private onUserLocationUpdate(position: GeolocationPosition): void {
    const { latitude, longitude, accuracy } = position.coords;
    const latLng = L.latLng(latitude, longitude);

    console.log(
      `[User-GPS] 📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` +
      ` | précision ±${Math.round(accuracy)}m` +
      ` | ${new Date(position.timestamp).toLocaleTimeString('fr-TN')}`
    );

    this.userGpsInfo = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) };

    // ── Créer ou déplacer le marqueur bleu ─────────────────────────
    if (!this.userMarker) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:18px;height:18px;
          background:#4285F4;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(66,133,244,0.6);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -12],
      });
      this.userMarker = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(this.map!)
        .bindPopup(`<b>📍 Ma position</b><br>Précision : ±${Math.round(accuracy)}m`);
      console.log('[User-GPS] ✅ Marqueur créé sur la carte');
      // Centrer la carte sur la position utilisateur au premier fix
      this.map?.panTo(latLng, { animate: true, duration: 0.8 });
    } else {
      this.userMarker.setLatLng(latLng);
      this.userMarker.setPopupContent(
        `<b>📍 Ma position</b><br>Précision : ±${Math.round(accuracy)}m`
      );
      console.log(`[User-GPS] ↻ Marqueur mis à jour → ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    }

    // ── Tracer le chemin parcouru (polyline verte pointillée) ────────
    this.userPositionPoints.push(latLng);
    if (this.userPositionPoints.length >= 2) {
      if (!this.userPolyline) {
        this.userPolyline = L.polyline(this.userPositionPoints, {
          color: '#34a853', weight: 3, opacity: 0.85, dashArray: '8,5',
        }).addTo(this.map!);
        console.log('[User-GPS] 🟢 Tracé de chemin initialisé');
      } else {
        this.userPolyline.setLatLngs(this.userPositionPoints);
        console.log(`[User-GPS] 📏 Tracé mis à jour : ${this.userPositionPoints.length} points`);
      }
    }
  }

  /** Callback erreur GPS passager */
  private onUserLocationError(err: GeolocationPositionError): void {
    const messages: Record<number, string> = {
      1: 'Accès GPS refusé. Autorisez la géolocalisation dans votre navigateur.',
      2: 'Position GPS non disponible (signal faible ?).',
      3: 'Délai GPS dépassé. Vérifiez votre signal.',
    };
    const msg = messages[err.code] ?? `Erreur GPS inconnue (code ${err.code}).`;
    this.userLocationError = msg;
    this.userLocationActive = false;
    this.toastr.error(msg, 'Ma Position', { timeOut: 4000 });
    console.error(`[User-GPS] ❌ Erreur code ${err.code}: ${msg}`);
  }

  getAllTragets() {
    this.http.get<any[]>(`${environment.apiUrl}/tragets/getAll`)
      .subscribe(
        response => {
          this.tragetsList = response;
        },
        error => {
          console.error('Erreur lors de la récupération des tragets', error);
        }
      );
  }

  private initMap(): void {
    this.map = L.map('map').setView([36.77, 10.18], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    //this.addSearchControl();

    this.map.on('click', (event) => {
      const latlng = event.latlng;
      this.addBusStopMarker(latlng);
      if (this.libelle !== null) {
      this.markers.push(L.marker(latlng).addTo(this.map!));
      }
      this.drawRoute();
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
      // Supprimer l'ancienne ligne de circuit avant de recalculer
      if (this.routePolylines.length > 0) {
        const last = this.routePolylines[this.routePolylines.length - 1];
        this.map!.removeLayer(last);
        this.routePolylines.pop();
      }
      // Tous les marqueurs comme waypoints (bug fix: slice(1,-1) excluait départ/arrivée)
      const wps = this.markers.map(m => [m.getLatLng().lat, m.getLatLng().lng] as [number, number]);
      this.fetchOsrmRoute(wps).then(pts => {
        if (!pts.length) return;
        const polyline = L.polyline(pts, { color: '#4285f4', weight: 5, opacity: 0.85 }).addTo(this.map!);
        this.routePolylines.push(polyline);
      });
    }
  }
  resetMarkers(): void {
    this.map!.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        this.map!.removeLayer(layer);
      }
    });

    this.routePolylines.forEach(pl => this.map!.removeLayer(pl));
    this.stationPolylines.forEach(pl => this.map!.removeLayer(pl));
    this.routePolylines = [];
    this.stationPolylines = [];
    this.markers = [];
  }
  removeLastMarkerAndRoute(): void {
    const lastMarker = this.markers.pop();
    if (lastMarker) this.map!.removeLayer(lastMarker);
    // Recalculer le circuit sans le dernier marqueur
    if (this.routePolylines.length > 0) {
      this.map!.removeLayer(this.routePolylines.pop()!);
    }
    if (this.markers.length >= 2) {
      this.drawRoute();
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
      const wps = markers.map(m => [m.getLatLng().lat, m.getLatLng().lng] as [number, number]);
      this.fetchOsrmRoute(wps).then(pts => {
        if (!pts.length) return;
        const polyline = L.polyline(pts, { color: '#4285f4', weight: 5, opacity: 0.85 }).addTo(this.map!);
        this.stationPolylines.push(polyline);
      });
    }
  });
}

}