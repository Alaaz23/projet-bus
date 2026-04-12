import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddSalarieComponent } from './add-salarie/add-salarie.component';
import { HomeComponent } from './home/home.component';
import { UpdateSalarieComponent } from './update-salarie/update-salarie.component';
import { UpdateBusComponent } from './update-bus/update-bus.component';
import { DeleteBusComponent } from './delete-bus/delete-bus.component';
import { DeleteSalariesComponent } from './delete-salaries/delete-salaries.component';
import { AddBusComponent } from './add-bus/add-bus.component';
import { LoginComponent } from './login/login.component';
import { MapComponent } from './map/map.component';
import { StationComponent } from './station/station.component';
import { TragetComponent } from './traget/traget.component';

const routes: Routes = [
  { path: '',redirectTo:'home',pathMatch: 'full'},
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'add-salarie', component: AddSalarieComponent },
  { path: 'update-salarie', component: UpdateSalarieComponent },
  { path: 'delete-salarie', component: DeleteSalariesComponent },
  { path: 'update-bus', component: UpdateBusComponent },
  { path: 'delete-bus', component: DeleteBusComponent },
  { path: 'add-bus', component: AddBusComponent },
  { path: 'stations', component: StationComponent },
  {path: 'tragets', component: TragetComponent},

  { path: 'map', component: MapComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
