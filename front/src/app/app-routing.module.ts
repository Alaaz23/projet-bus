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
import { LayoutComponent } from './layout/layout.component';
import { SalarieManagementComponent } from './salarie-management/salarie-management.component';
import { BusManagementComponent } from './bus-management/bus-management.component';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'salaries', component: SalarieManagementComponent },
      { path: 'buss', component: BusManagementComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'stations', component: StationComponent },
      { path: 'tragets', component: TragetComponent },
      { path: 'map', component: MapComponent },
      { path: 'add-bus', component: AddBusComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'update-bus', component: UpdateBusComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'delete-bus', component: DeleteBusComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'add-salarie', component: AddSalarieComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'update-salarie', component: UpdateSalarieComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
      { path: 'delete-salarie', component: DeleteSalariesComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } }
    ]
  },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
