import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupConfigurationComponent } from './setup-configuration.component';

describe('SetupConfigurationComponent', () => {
  let component: SetupConfigurationComponent;
  let fixture: ComponentFixture<SetupConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetupConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
