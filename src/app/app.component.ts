import { Component, Directive, ElementRef, Renderer } from "@angular/core";
import { ROUTER_DIRECTIVES } from "@angular/router";
import { Http } from "@angular/http";

import {Taggle} from "../ng2-taggle";

/////////////////////////
// ** Example Components
@Component({
  selector: "Home",
  template: `
    <div>Example - 1</div>
    <ng2-taggle [(tags)]="example1Tags"></ng2-taggle>
  `,
  directives: [Taggle]
})
export class Home {
  example1Tags: any[] = [
   {id: 1, name: "ONE"},
   {id: 2, name: "TWO"},
   {id: 3, name: "THREE"}
  ];
}

/////////////////////////
// ** MAIN APP COMPONENT **
@Component({
  selector: "app", // <app></app>
  directives: [
    ...ROUTER_DIRECTIVES
  ],
  styles: [`
    * { padding:0; margin:0; }
    #universal { text-align:center; font-weight:bold; padding:15px 0; }
    nav { background:#158126; min-height:40px; border-bottom:5px #046923 solid; }
    nav a { font-weight:bold; text-decoration:none; color:#fff; padding:20px; display:inline-block; }
    nav a:hover { background:#00AF36; }
    .hero-universal { min-height:500px; display:block; padding:20px;}
    .inner-hero { background: rgba(255, 255, 255, 0.75); border:5px #ccc solid; padding:25px; }
    .router-link-active { background-color: #00AF36; }
    blockquote { border-left:5px #158126 solid; background:#fff; padding:20px 20px 20px 40px; }
    blockquote::before { left: 1em; }
    main { padding:20px 0; }
    pre { font-size:12px; }
  `],
  template: `
  <h3 id="universal">ng2-taggle</h3>
  <nav>
    <a [routerLinkActive]="['active', 'router-link-active']" [routerLink]="['./home']">Home</a>
  </nav>
  <div class="hero-universal">
    <main>
      <router-outlet></router-outlet>
    </main>
  </div>
  `
})
export class App {
  title: string = "ftw";
  data = {};
  server: string;

  constructor(public http: Http) { }

  ngOnInit() {
  }
}
