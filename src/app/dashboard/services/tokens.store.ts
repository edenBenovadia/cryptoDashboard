import { Injectable } from '@angular/core';
import { catchError, concatMap, Observable, of, tap } from 'rxjs';

import { EtherScanHttpService } from './ether-scan-http.service';
import { ComponentStore } from '@ngrx/component-store';
import { Token, TokenState } from '..';

const EmptyState: TokenState = {
  tokensEntities: new Map<string, Token>(),
  tokensList: [],
  hasError: false,
}

@Injectable({
  providedIn: 'root'
})
export class TokensStore extends ComponentStore<TokenState> {
  constructor(
    private etherScanHttpService: EtherScanHttpService,
  ) {
    super(EmptyState);
  }

  /*************************effects**************************************/
  readonly loadTokens = this.effect((address$: Observable<string>) => {
    return address$
    .pipe(
      concatMap((address) => {
        return this.etherScanHttpService.getBalanceForAddress(address)
        .pipe(
          catchError((err) =>  {
            console.log(err);
            this.errorLoading();
  
            return of([]);
          }),
        )
      }),
      tap((tokens) => {
        if (tokens.length > 0) {
          this.addTokens(tokens);
        }
      }),
    );
  });

  readonly resetTokens = this.effect((reset$) => {
    return reset$
    .pipe(
      tap(() => {
        this.clearTokens();
      }),
    );
  });

  readonly upsertTokens = this.updater((state, tokens: Token[]) => {
    const { tokensEntities } = state;
    tokens.forEach(token => {
      const key = token.symbol;
      if (tokensEntities.has(key)) {
        const updatedToken = Object.assign(tokensEntities.get(key), token);
        tokensEntities.set(key, updatedToken);
      } else {
        tokensEntities.set(key, token);
      }
    });

    return <TokenState> {
      ...state,
      tokensEntities: tokensEntities,
      hasError: false,
    }
  });

  /*************************reducers**************************************/
  readonly clearTokens = this.updater((state) => {
    return <TokenState> {
      ...state,
      tokensEntities: new Map<string, Token>(),
      hasError: false,
    }
  });

  readonly addTokens = this.updater((state, tokens: Token[]) => {
    const tokensMap = new Map<string, Token>()
    tokens.forEach(token => {
      const key = token.symbol;
      tokensMap.set(key, token);
    });

    return <TokenState> {
      ...state,
      tokensEntities: tokensMap,
      hasError: false,
    }
  });

  readonly errorLoading = this.updater((state) => {
    return <TokenState> {
      ...state,
      tokensEntities: new Map<string, Token>(),
      hasError: true,
    }
  });

  /*************************selectors**************************************/
  readonly tokens$: Observable<Token[]> = this.select(state => {
    const tokensList: Token[] = [];
    state.tokensEntities.forEach(token => {
      if (!!token.totalValueInDollars) {
        tokensList.push(token)
      }
    });

    return tokensList;
  });

  readonly hasError$: Observable<boolean> = this.select(state => {
    return state.hasError;
  });
} 