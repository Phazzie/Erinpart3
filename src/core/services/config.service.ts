import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export const SESSION_ID_PATTERN = /^[A-Z0-9]{6}$/;

@Injectable({ providedIn: 'root' })
export class ConfigService {
  readonly appName = environment.appName;
  readonly version = environment.version;
  readonly production = environment.production;

  readonly features = {
    revealVoteThreshold: environment.features.revealVoteThreshold,
  };

  readonly qrCode = {
    width: environment.qrCode.width,
    margin: environment.qrCode.margin,
    colorDark: environment.qrCode.colorDark,
    colorLight: environment.qrCode.colorLight,
  };

  readonly session = {
    idLength: environment.session.idLength,
    idPattern: environment.session.idPattern,
  };

  readonly ui = {
    copyFeedbackDuration: environment.ui.copyFeedbackDuration,
  };
}
