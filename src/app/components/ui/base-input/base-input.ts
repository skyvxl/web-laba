import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-base-input',
  imports: [ReactiveFormsModule],
  templateUrl: './base-input.html',
  styleUrl: './base-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseInput {
  title = input<string>();
  placeholder = input<string>();
  type = input<string>('text');
  value = input<string>('');
  disabled = input<boolean>(false);
  required = input<boolean>(false);
  valueChange = output<string>();

  control = new FormControl(this.value(), { nonNullable: true });

  private destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const newValue = this.value();
      if (newValue !== this.control.value) {
        this.control.setValue(newValue, { emitEvent: false });
      }
    });

    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.control.disable({ emitEvent: false });
      } else {
        this.control.enable({ emitEvent: false });
      }
    });

    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((newValue) => {
      this.handleValueChange(newValue);
    });
  }

  handleValueChange(newValue: string) {
    this.valueChange.emit(newValue);
  }
}
