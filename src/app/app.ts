import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BaseInput } from './components/ui/base-input/base-input';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, BaseInput, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
