import {
    Component,
    input,
} from "@angular/core";


export interface MenuItem
{
  readonly name: string;
  readonly callback: (
    e: Event
  ) => void;
  readonly active: boolean;
}

@Component(
  {
    selector: 'pn-menu-item',
    templateUrl: './menu-item.html',
  },
)
export class MenuItemComponent
{
  menuItem = input.required<MenuItem>(
  );
}
