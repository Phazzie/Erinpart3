export const environment = {
  production: false,
  appName: "Erin's Escapades",
  version: '0.0.0',
  features: {
    revealVoteThreshold: 2,
  },
  qrCode: {
    width: 256,
    margin: 2,
    colorDark: '#083344',
    colorLight: '#cffafe',
  },
  session: {
    idLength: 6,
    idPattern: /^[A-Z0-9]{6}$/,
  },
  ui: {
    copyFeedbackDuration: 2000,
  },
};
