import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DirectMessageSenderComponent } from './direct-message-sender/direct-message-sender.component';
import { ConnectedComponent } from './connected-component/connected.component';
import { LoginComponent } from './login-component/login.component';
import { SetupConfigurationComponent } from './configuration/setup-configuration.component';
import { EchoComponent } from './echo/echo.component';
import { ConfigurationComponent } from './configuration/configuration.component';

@NgModule({
  declarations: [
    AppComponent,
    DirectMessageSenderComponent,
    ConnectedComponent,
    LoginComponent,
    SetupConfigurationComponent,
    EchoComponent,
    ConfigurationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
