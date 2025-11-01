import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BaseInput } from './components/ui/base-input/base-input';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, BaseInput],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
