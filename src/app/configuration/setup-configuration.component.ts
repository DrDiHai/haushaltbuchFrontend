// console.log('init setup component');

import { Component, OnInit } from '@angular/core';
import { ConnectedComponent } from '../connected-component/connected.component';
import { ConnectionService } from '../connection.service';
import { Configuration, DBs, UserModes, } from "./configuration.component";
import { IncomingMessage, MessageType } from '../messages/Message'
import { FetchSetupMessage, ObjectSetupMessage, StoreSetupMessage } from '../messages/setup.messages';

@Component({
  selector: 'app-setup-configuration',
  templateUrl: './setup-configuration.component.html',
  styleUrls: ['./setup-configuration.component.css']
})
export class SetupConfigurationComponent extends ConnectedComponent implements OnInit {

  constructor(protected override connectionService: ConnectionService) {
    super(connectionService);
    this.setComponentID('SetupConfigComponent');
  }


  configuration: Configuration = {
    app: { userMode: UserModes.single },
    db_cfg: {
      db: DBs.sqlite,
      file: 'money_pilot.sqlite.db'
    }
  };
  get dbOption(): DBs { return this.configuration.db_cfg.db; }
  set dbOption(v: DBs) {
    this.configuration.db_cfg.db = v;
    if (v === DBs.sqlite) {
      if ( ! this.db_filename) {
        this.db_filename = 'money_pilot.sqlite.db';
      }
      delete this.configuration.db_cfg.host;
      delete this.configuration.db_cfg.dbname;
      delete this.configuration.db_cfg.dbuser;
      delete this.configuration.db_cfg.password;
    }
    if (v === DBs.mariadb) { delete this.configuration.db_cfg.file; }
  }
  db_locations: string[] = [''];
  db_location: string = '';
  db_filename: string = '';
  adminuser: string = '';
  adminpassword: string = '';

  dbuser: string = '';
  dbpassword: string = '';

  dbcfg_file_searchpath: string[] = [''];
  dbcfg_file_searchpath_as_string: string = '';
  dbcfg_file_default: string = 'configuration.json';
  dbcfg_file_location: string = '';
  dbcfg_file: string = this.dbcfg_file_default;
  filepath_delimiter: string = '/'
  result: any;

  override handleMessages(message: IncomingMessage): void {
    if (message.type === MessageType.Hello) {
      this.token = message.token;
      const fetch_message = new FetchSetupMessage('setup_config', 'search_path');
      this.sendMessage(fetch_message);
    }
    if (message instanceof(ObjectSetupMessage)) {
      this.db_locations = message.payload.db_paths;
      this.db_location = message.payload.db_paths[0];
      this.db_filename = 'money_pilot.sqlite.db';
      const search_path = message.payload.search_path;
      this.dbcfg_file_searchpath = search_path;
      this.dbcfg_file_searchpath_as_string = search_path.join(' → ');
      this.dbcfg_file_location = search_path[0];
      if (message.payload.system == 'Windows')
        this.filepath_delimiter = '\\';
      else
        this.filepath_delimiter = '/';
    }
  }

  submitForm() {
    if (this.configuration.db_cfg.db===DBs.sqlite) {
      if (this.db_location == 'custom') {
        this.configuration.db_cfg.file = this.db_filename;
      } else {
        this.configuration.db_cfg.file = this.db_location+this.filepath_delimiter+this.db_filename;
      }
    }
    this.result = {configuration: this.configuration};
    if (this.configuration.app.userMode === UserModes.multi) {
      this.result.adminuser = {name: this.adminuser, password: this.adminpassword};
    }
    if (this.dbcfg_file_location == 'custom'){
      this.result.dbcfg_file = this.dbcfg_file;
    } else {
      this.result.dbcfg_file = this.dbcfg_file_location+this.filepath_delimiter+this.dbcfg_file
    }
    console.log(this.result)
    const message = new StoreSetupMessage('setup_config', '', this.result);
    console.groupCollapsed('StoreMessage');
    console.log(message);
    console.log(JSON.stringify(message));
    console.groupEnd();
    this.sendMessage(message);
  }
  override ngOnInit() {
    const observeHandshake = true;
    this.getConnection(observeHandshake);
  }
}
