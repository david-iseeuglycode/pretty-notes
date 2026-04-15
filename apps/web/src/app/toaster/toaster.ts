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
        throw new TypeError('TOASTER MESSAGE NOT SET');
      }

      return this.toasterDto()?.message ?? this.message()!;
    }
  );
  _error = computed(
    (): boolean => this.toasterDto()?.error ?? this.error()
  );
  _secondsToLive = computed(
    (): number => this.toasterDto()?.secondsToLive ?? this.secondsToLive()
  );
  _displayCloserIcon = computed(
    (): boolean => this.toasterDto()?.displayCloserIcon ?? this.displayCloserIcon()
  );


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
