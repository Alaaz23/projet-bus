import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AddSalarieComponent } from './add-salarie/add-salarie.component';
import { DeleteSalariesComponent } from './delete-salaries/delete-salaries.component';
import { UpdateSalarieComponent } from './update-salarie/update-salarie.component';
import { AddBusComponent } from './add-bus/add-bus.component';
import { UpdateBusComponent } from './update-bus/update-bus.component';
import { DeleteBusComponent } from './delete-bus/delete-bus.component';
import { MapComponent } from './map/map.component';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CountUpModule } from 'ngx-countup';
import { CommonModule } from '@angular/common';

import { LayoutComponent } from './layout/layout.component';
import { ToastrModule } from 'ngx-toastr';
import { StationComponent } from './station/station.component';
import { TragetComponent } from './traget/traget.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SalarieManagementComponent } from './salarie-management/salarie-management.component';
import { AuthTokenInterceptor } from './core/auth.interceptor';
import { BusManagementComponent } from './bus-management/bus-management.component';
import { FeedbackManagementComponent } from './feedback-management/feedback-management.component';


@NgModule({
    declarations: [
        AppComponent,
        AddSalarieComponent,
        DeleteSalariesComponent,
        UpdateSalarieComponent,
        AddBusComponent,
        UpdateBusComponent,
        DeleteBusComponent,
        MapComponent,
        HomeComponent,
        LayoutComponent,
        TragetComponent,
        SalarieManagementComponent,
        BusManagementComponent,
        FeedbackManagementComponent
    ],
    providers: [
        ConfirmationService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true }
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule,
        AppRoutingModule,
        LoginComponent,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        CountUpModule,
        CommonModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot(),
          StationComponent,
              ConfirmDialogModule   // ⭐ IMPORTANT

        
    ]
})
export class AppModule { }
