import {
    Component,
    computed,
    effect,
    input,
    output,
} from "@angular/core";


export interface ToasterDto
{
  message: string;
  error?: boolean;
  secondsToLive?: number;
  displayCloserIcon?: boolean;
}

@Component(
  {
    selector: 'pn-toaster',
    templateUrl: './toaster.html',
    styleUrl: './toaster.scss',
  },
)
export class ToasterComponent
{
  toasterDto = input<ToasterDto>();
  message = input<string>();
  error = input<boolean>(
    false,
  );
  secondsToLive = input<number>(
    0,
  );
  displayCloserIcon = input<boolean>(
    true,
  );
  closed = output();
  closingTimeout: any = null;
  _message = computed(
    (): string => {
      if (
        !this.toasterDto()
        && !this.message() 
      ) {
        throw 'TOASTER MESSAGE NOT SET';
      }

      return this.toasterDto()
        ? this.toasterDto()!.message
        : this.message()!;
    }
  );
  _error = computed(
    (): boolean => {
      return this.toasterDto()
        ? this.toasterDto()!.error
          ? this.toasterDto()!.error!
          : false
        : this.error();
    }
  );
  _secondsToLive = computed(
    (): number => {
      return this.toasterDto()
        ? this.toasterDto()!.secondsToLive
          ? this.toasterDto()!.secondsToLive!
          : 0
        : this.secondsToLive();
    }
  );
  _displayCloserIcon = computed(
    (): boolean => {
      return this.toasterDto()
        ? this.toasterDto()!.displayCloserIcon
          ? this.toasterDto()!.displayCloserIcon!
          : true
        : this.displayCloserIcon();
    }
  )


  constructor() {
    effect(
      () => {
        clearTimeout(
          this.closingTimeout,
        );

        if (
          this._secondsToLive() > 0
        ) {
          this.closingTimeout = setTimeout(
            () => {
              this.closed.emit();
            },
            1000 * this._secondsToLive(),
          );
        }
      }
    );
  }

  close(): void {
    clearTimeout(
      this.closingTimeout,
    );
    this.closed.emit();
  }
}
