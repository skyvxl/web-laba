import { Component } from '@angular/core';
import { BaseInput } from '../../ui/base-input/base-input';

@Component({
  selector: 'app-contacts',
  imports: [BaseInput],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
})
export class Contacts {}
