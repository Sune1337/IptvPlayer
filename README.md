# IptvPlayer

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.6.

## Generate Angular project
`npx @angular/cli@17 new iptv-player`

## Use PrimeNG
```shell
npm install --save primeng@17
npm install --save primeflex@3
npm install --save primeicons@7
```

## Use Dexie for IndexDB access
```shell
npm install --save dexie@4
```

## Generate web-worker for background processing.
```shell
npx ng generate web-worker background-processing/app
```

## Video-player
```shell
npm install --save shaka-player@4
```

## Open in MPV
https://github.com/b01o/mpv-url-proto/blob/main/mpv-url-proto-install.bat

note: the generated "open_in_mpv.bat" needs to be changed to:
```shell
start "mpv" "C:\Users\linkri\Downloads\mpv-x86_64-v3-20240505-git-c4b6d0d\mpv.exe" "%u:~4%"
```

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
