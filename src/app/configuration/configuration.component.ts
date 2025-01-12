import { Component, OnInit } from '@angular/core';

export enum UserModes { single = 'single', multi = 'multi' }
export enum DBs { sqlite = 'SQLite', mariadb = 'MariaDB' }

export class Configuration {
  app: { userMode: UserModes } = { userMode: UserModes.single }
  db_cfg: {
    db: DBs,
    file?: string,
    host?: string,
    dbname?: string,
    dbuser?: string,
    password?: string
  } = { db: DBs.sqlite}
}


@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.css']
})
export class ConfigurationComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

