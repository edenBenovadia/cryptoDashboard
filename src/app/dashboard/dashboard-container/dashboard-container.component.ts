import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TokensStore } from '../services/tokens.store';
import { WalletService } from '../services/wallet.service';

@Component({
  selector: 'dashboard-container',
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.less']
})
export class DashboardContainerComponent implements OnInit, OnDestroy {

  public connection: string;
  public changedAddress: string = '';
  private destroy$: Subject<void> = new Subject()

  constructor(
    private wallet: WalletService,
    private readonly cd: ChangeDetectorRef,
    private readonly tokensStore: TokensStore,
  ) { }

  ngOnInit(): void {
    this.wallet.isConnected()
    .pipe(takeUntil(this.destroy$))
    .subscribe(connected => {
      if (connected) {
        this.connection = 'Connected';
      } else {
        this.connection = 'Connect to metamask';
      }

      this.cd.detectChanges();
    });

    this.wallet.getAccount()
    .pipe(
      takeUntil(this.destroy$),
    ).subscribe((address) => {
      if (!!address) {
        this.tokensStore.loadTokens(address);
      } else {
        this.tokensStore.resetTokens();
      }
    });
  }
  
  public changeAddress(event: any) {
    if (!!event) {
      event.preventDefault();
    }

    if (!!event.target.value) {
      this.changedAddress = event.target.value;
      this.wallet.setAccount(event.target.value);
    } 
  }

  public resetAddress() {
    this.changedAddress = '';
    this.wallet.resetAddress();
  }

  public connect(): void {
    this.wallet.connect();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
