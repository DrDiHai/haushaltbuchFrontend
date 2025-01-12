import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import * as rxjs from 'rxjs';
import { AppComponent } from './app.component';
import { Message, MessageType } from './messages/Message';
import { WelcomeMessage, ByeMessage } from "./messages/admin.messages";
import { ConnectionService } from './connection.service';

class MockConnectionService {
  getNewConnection(
    subscriber: AppComponent,
    loginSubjectOrObserveHandshake?: rxjs.Subject<any> | boolean,
    isPrimary?: boolean
  ) {}
  removeConnection(componentId: string): void {}
}

describe('AppComponent', () => {
  let fixture: ComponentFixture<any>;
  let appComponent: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        // AppComponent,
        { provide: ConnectionService, useClass: MockConnectionService}
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    appComponent = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(appComponent).toBeTruthy();
    expect(appComponent.componentID).toContain('AppComponent_');
  });

  it(`should have as title 'haushaltbuchFrontend'`, () => {
    expect(appComponent.title).toEqual('haushaltbuchFrontend');
  });
 
  /*
  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.content span')?.textContent).toContain('haushaltbuchFrontend app is running!');
  });
  */

  it('should create connection on init', () => {
    const conSrv = fixture.debugElement.injector.get(ConnectionService);
    const spyOnGetNewConn = spyOn(conSrv, 'getNewConnection');
    const spyOnRemoveConn = spyOn(conSrv, 'removeConnection');
    expect(appComponent.connected).toBeFalse();
    appComponent.ngOnInit();
    expect(spyOnGetNewConn).toHaveBeenCalledWith(appComponent, true, true);
    expect(appComponent.connected).toBeTrue();
    expect(spyOnRemoveConn).not.toHaveBeenCalled();
  })

  it('should remove connection on destroy', () => {
    const conSrv = fixture.debugElement.injector.get(ConnectionService);
    const spyOnRemoveConn = spyOn(conSrv, 'removeConnection');
    appComponent.ngOnInit();
    expect(spyOnRemoveConn).not.toHaveBeenCalled();
    appComponent.ngOnDestroy();
    expect(spyOnRemoveConn).toHaveBeenCalled();
  })

  it('should activate Login until receiving Welcome message', () => {
    const mockWelcomeMessage = new WelcomeMessage(
      {type: MessageType.Welcome, token: 'mockToken', ses_token: 'mockSession'});
    expect(appComponent.activateLoginComponent).withContext('before Welcome').toBeTrue();
    appComponent.handleMessages(mockWelcomeMessage);
    expect(appComponent.activateLoginComponent).withContext('after Welcome').toBeFalse();
  });
});
