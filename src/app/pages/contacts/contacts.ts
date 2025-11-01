import { Component } from '@angular/core';
import { BaseInput } from '../../shared/components/base-input/base-input';

@Component({
  selector: 'app-contacts',
  imports: [BaseInput],
  templateUrl: './contacts.html',
  styleUrl: './contacts.css',
})
export class Contacts {}
