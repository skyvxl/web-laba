import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import IMask from 'imask';

// Минималный интерфейс для маски, чтобы избежать использования `any`
interface MaskLike {
  value?: string;
  on?: (event: string, handler: () => void) => void;
  destroy?: () => void;
}

@Component({
  selector: 'app-base-input',
  imports: [ReactiveFormsModule],
  templateUrl: './base-input.html',
  styleUrl: './base-input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseInput implements AfterViewInit, OnDestroy {
  title = input<string>();
  placeholder = input<string>();
  type = input<string>('text');
  value = input<string>('');
  disabled = input<boolean>(false);
  // optional prefix that will be prepended to the value (e.g. "+7")
  prefix = input<string | undefined>(undefined);
  // if true, user cannot remove the prefix; it will be auto-restored
  immutablePrefix = input<boolean>(false);
  required = input<boolean>(false);
  valueChange = output<string>();

  control = new FormControl(this.value(), { nonNullable: true });
  @ViewChild('inputRef', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  private mask: MaskLike | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  private destroyRef: DestroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const newValue = this.value();
      let v = newValue ?? '';
      const p = this.prefix?.() ?? '';
      if (p && this.immutablePrefix?.()) {
        if (!v.startsWith(p)) v = p + v;
      }
      if (v !== this.control.value) {
        this.control.setValue(v, { emitEvent: false });
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

    // Управление валидаторами (required)
    effect(() => {
      const isRequired = this.required?.() ?? false;
      const validators = isRequired ? [Validators.required] : [];
      this.control.setValidators(validators);
      // Не триггерим лишних событий
      this.control.updateValueAndValidity({ emitEvent: false });
    });

    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((newValue) => {
      // Если маска и телефонный тип — синхронизируем маску и не запускаем стандартную нормализацию
      if (this.mask && this.type?.() === 'tel') {
        try {
          if (this.mask.value !== newValue) this.mask.value = newValue;
        } catch {
          /* ignore */
        }
        return;
      }

      this.handleValueChange(newValue);
    });

    // Если указан immutable префикс, и родитель не установил начальное значение — эмитим префикс
    const pInit = this.prefix?.() ?? '';
    if (pInit && this.immutablePrefix?.() && !(this.value() ?? '').startsWith(pInit)) {
      // Для телефонов с префиксом +7 устанавливаем начальное форматирование
      if (this.type?.() === 'tel' && pInit.replace(/\D/g, '') === '7') {
        this.control.setValue(pInit, { emitEvent: false });
        this.valueChange.emit(pInit);
      } else {
        this.control.setValue(pInit, { emitEvent: false });
        this.valueChange.emit(pInit);
      }
    }
  }

  handleValueChange(newValue: string) {
    const p = this.prefix?.() ?? '';
    // Если есть immutable префикс — нормализуем ввод
    if (p && this.immutablePrefix?.()) {
      // Если значение пустое или состоит только из плюсов — восстанавливаем префикс
      if (!newValue || /^\++$/.test(newValue)) {
        this.control.setValue(p, { emitEvent: false });
        this.valueChange.emit(p);
        return;
      }

      // Удалим все не-цифры для работы с цифройной частью
      const digitsOnly = (newValue || '').replace(/\D/g, '');
      const pDigits = p.replace(/\D/g, '');

      // Если префикс содержит цифры (например +7), отрежем их от начала набора цифр, если пользователь случайно ввёл их
      let restDigits = digitsOnly;
      if (pDigits && restDigits.startsWith(pDigits)) {
        restDigits = restDigits.slice(pDigits.length);
      }

      // Специальная маска для России (+7)
      if (this.type?.() === 'tel' && p.replace(/\D/g, '') === '7') {
        const capped = restDigits.slice(0, 10); // максимум 10 цифр после +7
        const a = capped.slice(0, 3);
        const b = capped.slice(3, 6);
        const c = capped.slice(6, 8);
        const d = capped.slice(8, 10);

        let formatted = p;
        if (a.length > 0) {
          formatted += ' (' + a;
          if (a.length === 3) formatted += ')';
        }
        if (b.length > 0) {
          formatted += (a.length === 3 ? ' ' : '') + b;
        }
        if (c.length > 0) {
          formatted += '-' + c;
        }
        if (d.length > 0) {
          formatted += '-' + d;
        }

        // Если пользователь только начал ввод, не оставляем незакрытую скобку без номера
        if (formatted === p + ' (') {
          formatted = p;
        }

        this.control.setValue(formatted, { emitEvent: false });
        this.valueChange.emit(formatted);
        return;
      }

      // Общая логика: просто восстанавливаем префикс и оставляем только цифры после него
      const fixed = p + restDigits;
      this.control.setValue(fixed, { emitEvent: false });
      this.valueChange.emit(fixed);
      return;
    }

    this.valueChange.emit(newValue);
  }

  ngAfterViewInit(): void {
    // Инициализируем imask для телефона, если есть inputRef
    try {
      if (this.inputRef && this.type?.() === 'tel') {
        // Используем российскую маску +7 (000) 000-00-00
        this.mask = IMask(this.inputRef.nativeElement, {
          mask: '+{7} (000) 000-00-00',
          lazy: true,
        });

        // Установим начальное значение маски
        try {
          if (this.control.value) this.mask.value = this.control.value as string;
        } catch {
          // ignore
        }

        // При приёме ввода синхронизируем FormControl
        this.mask.on?.('accept', () => {
          let v = String(this.mask?.value ?? '');

          // Нормализация для случая immutable префикса (например "+7")
          const p = this.prefix?.() ?? '';
          if (p && this.immutablePrefix?.()) {
            // Если значение пустое или состоит только из плюсов — восстанавливаем префикс
            if (!v || /^\++$/.test(v)) {
              v = p;
            } else {
              if (!v.startsWith(p)) v = p + v;
              // Удаляем лишние плюсы после префикса (например "+7+" -> "+7")
              const after = v.slice(p.length).replace(/\+/g, '');
              v = p + after;
            }
          }

          // Синхронизируем контрол и эмитим значение
          try {
            if (this.control.value !== v) this.control.setValue(v, { emitEvent: false });
          } catch {
            // ignore
          }
          this.valueChange.emit(v);

          // Убедимся, что маска тоже содержит нормализованное значение
          try {
            if (this.mask && this.mask.value !== v) this.mask.value = v;
          } catch {
            // ignore
          }
        });

        // Если установлен immutable prefix — предотвратить удаление префикса клавишами Backspace/Delete
        if (this.immutablePrefix?.() && this.prefix?.() && this.inputRef?.nativeElement) {
          const prefixLen = (this.prefix() ?? '').length;
          this.keydownHandler = (ev: KeyboardEvent) => {
            const el = this.inputRef.nativeElement as HTMLInputElement;
            const start = el.selectionStart ?? 0;

            // Если выделение полностью справа от префикса — разрешаем
            if (start >= prefixLen) return;

            // В остальных случаях блокируем удаление внутри префикса
            if (ev.key === 'Backspace' || ev.key === 'Delete') {
              ev.preventDefault();
            }
          };
          this.inputRef.nativeElement.addEventListener(
            'keydown',
            this.keydownHandler as EventListener,
          );
        }
      }
    } catch {
      // Если imask не доступен — ничего страшного, продолжим без маски
      this.mask = null;
    }
  }

  ngOnDestroy(): void {
    try {
      if (this.mask) {
        this.mask.destroy?.();
        this.mask = null;
      }
      if (this.keydownHandler && this.inputRef?.nativeElement) {
        try {
          this.inputRef.nativeElement.removeEventListener(
            'keydown',
            this.keydownHandler as EventListener,
          );
        } catch {
          // ignore
        }
        this.keydownHandler = null;
      }
    } catch {
      // noop
    }
  }
}
