import { Component, OnDestroy } from '@angular/core';
import { IptvDbService } from '../db/iptv-db-service';
import { Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnDestroy {

  // Form controls.
  public formGroup: FormGroup;
  public playlistUrlControl: FormControl<string | null>;

  // Keep track of subscriptions to clean up when component destroys.
  private ngUnsubscribe = new Subject<void>();

  constructor(
    private iptvDbService: IptvDbService
  ) {
    // Setup form-controls.
    this.formGroup = new FormGroup({
      id: new FormControl<number | undefined>(undefined),
      playlistUrl: this.playlistUrlControl = new FormControl('')
    });

    // Subscript to settings from db.
    iptvDbService.accountSettings
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(accountSettings => {
          this.formGroup.setValue(accountSettings);
        }
      )
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public whenSaveClick = async (): Promise<void> => {
    await this.iptvDbService.saveAccountSettings(this.formGroup.value);
  }
}
