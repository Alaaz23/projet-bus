import { Component } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  status = false;

  addToggle() {
    this.status = !this.status;
  }

  teamMenuExpanded: boolean = false;
  tablesMenuExpanded = false;

  // Index signature to address TypeScript error
  [key: string]: any;

  // Function to toggle expanded state
  toggleMenu(menu: string): void {
    this[menu] = !this[menu];
  }
}
