# xp-tool Teknisk Gjeld — Rapport og B18-plan

## 1. Kritisk funn: B16 vs B17 — Rotårsak

**Begge `main` og `develop` har `"version": "2.0.0-B17"` i package.json, men de er IKKE like.**

`develop`-branchen ligger **17 commits foran `main`** med viktige endringer som aldri ble merget:

| Endring på `develop` | Beskrivelse | Påvirkning |
|---|---|---|
| Babel-pakker oppdatert | `@babel/core` 7.11→7.23, alle plugins oppdatert | **B16 (main) krasjer** med eldre Babel der `develop` fungerer |
| `check-missing` forbedret | Støtte for `.jsxxml`-extension, `description`-tag, fallback til build-path | **Feil i phrase-sjekk på main** |
| `jsx-xml.js` builtIns-path | `dist/components` → `templates/jsx` | **B16 finner ikke templates** |
| `xp.js` — `getSite()` + `buildPath` | Ny funksjon, nytt felt | Mangler i B16 |
| Alle dependencies oppgradert | 20+ pakker bumped | Sikkerhetshull i B16 |

**Konklusjon:** Det som ble publisert som "B16" (fra `main`) og "B17" (fra `develop`) er **to helt forskjellige kodebaser med samme versjonsnummer**. PR #9 og #10 og #11 ble aldri merget til `main`. Dette forklarer hvorfor noen brukere opplever at ting fungerer og andre ikke — de har installert fra forskjellige kilder/brancher.

### B16 vs B17: konkret forskjellskart (teknisk)

- `main` peker til commit `74ae8f6`.
- `develop` peker til commit `64667f5`.
- Avstand: `develop` er 17 commits foran `main`.
- Begge har fortsatt `version: 2.0.0-B17` i `package.json`.

#### Commitlinje som skaper funksjonsforskjell

- PR #9 (`20ea08f`): JSX/XML-fikser, phrase check-missing-fikser, watch-fikser.
- PR #10 (`c4fc6b8`): bred package-oppgradering.
- PR #11 (`64667f5`): ekstra Babel-fix (`@babel/core`).

Disse finnes i `develop`, men ikke i `main`.

#### Filendringer som påvirker prosjekter direkte

| Fil | B16 (`main`) | B17 (`develop`) | Typisk effekt i prosjekt |
|---|---|---|---|
| `lib/jsx-xml/jsx-xml.js` | Built-ins lastes fra `dist/components` | Built-ins lastes fra `templates/jsx` | Prosjekter kan få "finner ikke Summary/Description/Image" i B16, men ikke i B17 |
| `lib/jsx-xml/constants.js` | Kun `.xml.jsx` flyt | Støtte for alternativ extension (`.jsxxml`) via config | Prosjekter med alternativ extension virker i B17, men ikke i B16 |
| `lib/jsx-xml/template.js` | Hardkodet extension-håndtering i path-regex | Extension-aware regex | Feil resolving/import i enkelte template-scenarier i B16 |
| `tasks/phrase/check-missing.js` | Ingen `<description>`-sjekk, mindre robust filoppslag | Sjekker også `<description>`, fallback til build-path | B17 finner flere faktiske i18n-avvik og fungerer bedre på generert XML |
| `lib/util/xp.js` | Ingen `getSite()`, ingen `buildPath` | Har `getSite()` og `buildPath` i objektliste | Bedre datagrunnlag for phrase-check og site-relaterte scans |
| `tasks/jsx-xml/watch.js` / `tasks/subproject/watch.js` | Enklere watch-oppsett | Forbedret chokidar-oppsett (`ignoreInitial`, events, queue) | Mindre støy/mer stabil watch i B17 |
| `package.json` / `package-lock.json` | Eldre dependency-sett | Oppgradert dependency-sett (inkl. Babel-kjede) | B16 får flere avhengighets- og sikkerhetsproblemer |

#### Hvorfor begge brukes i markedet nå

1. Team/prosjekter har installert fra ulike tidspunkter og ulike pipelines.
2. Publisering og branch-strategi har ikke vært stram nok (ikke én tydelig release-kilde).
3. Manglende entydig tagging/versjonsdisciplin har gjort det uklart hvilken kode som ligger bak "B17".

#### Hvordan kjenne igjen hva et prosjekt i praksis bruker

1. Hvis prosjektet feiler på built-ins path (`dist/components` vs `templates/jsx`), er det ofte B16-lik kode.
2. Hvis prosjektet støtter `.jsxxml` og får `<description>`-i18n-check, er det ofte B17-lik kode.
3. Sammenlign installert pakkeinnhold mot nøkkelfiler over for å klassifisere variant.

#### Operativ anbefaling for alle berørte prosjekter

1. Klassifiser hvert prosjekt som "B16-lik" eller "B17-lik" før oppgradering.
2. Kjør standard verifikasjon etter oppgradering: `jsx-xml:build`, `phrase:check-missing`, `jsx-xml:watch`.
3. Loggfør hvilken variant prosjektet hadde før B18 for raskere feilsøking ved regresjon.

## 2. Git-brancher — Opprydding

| Branch | Status | Anbefaling |
|---|---|---|
| `main` | Sist oppdatert **juni 2023** | Oppdater med develop |
| `develop` | Sist oppdatert **jan 2024**, 17 commits foran | **Merge til main** |
| `dependabot/npm_and_yarn/json5-2.2.3` | Utdatert (2022) | **Slett** |
| `dependabot/npm_and_yarn/moment-2.29.2` | Utdatert (2022) | **Slett** |
| `dependabot/npm_and_yarn/xmldom/xmldom-0.7.8` | Utdatert (2022) | **Slett** |
| `dependabot/npm_and_yarn/xmldom/xmldom-and-cldr-0.8.3` | Utdatert (2022) | **Slett** |
| `fix-readme-and-jsx-check-missing` | Allerede merget til develop | **Slett** |

**5 stale brancher** kan slettes.

## 3. Sikkerhetssvakheter (npm audit)

**30 sårbarheter:** 3 critical, 14 high, 8 moderate, 5 low

| Sårbarhet | Alvorlighet | Pakke | Løsning |
|---|---|---|---|
| Arbitrary code execution | **CRITICAL** | `@babel/traverse` <7.23.2 | Oppdater Babel |
| XML injection (6 CVE-er) | **CRITICAL** | `@xmldom/xmldom` ≤0.8.12 | Oppdater `cldr` |
| Symlink dir write | **HIGH** | `tmp` ≤0.2.3 | Fjern (ubrukt) |
| ReDoS | **HIGH** | `semver`, `picomatch`, `braces`, `cross-spawn`, `flatted` | `npm audit fix` + oppdater ESLint |
| Regex DoS | **MODERATE** | `ajv`, `brace-expansion`, `word-wrap` | `npm audit fix` |
| Babel regex inefficiency | **MODERATE** | `@babel/helpers/runtime` | Oppdater Babel |

## 4. Ubrukte pakker — Kan fjernes

| Pakke | Versjon | Grunn |
|---|---|---|
| `@babel/cli` | 7.16.0 | Ikke importert noe sted; `@babel/core` brukes direkte |
| `@babel/preset-env` | 7.11.0 | Ikke brukt i BABEL_OPTIONS; kun 3 spesifikke plugins brukes |
| `moment` | 2.29.4 | Ikke importert noe sted |
| `winston` | 3.6.0 | Ikke importert noe sted |
| `replace-in-file` | 6.3.2 | Ikke importert noe sted |
| `tmp` | 0.2.1 | Ikke importert noe sted |

**6 pakker** kan fjernes = reduserer avhengigheter fra 36 til 30.

## 5. Babel-modernisering

Siden Babel 7.14 er disse plugin-ene innebygd i `@babel/preset-env`:
- `@babel/plugin-proposal-nullish-coalescing-operator`
- `@babel/plugin-proposal-optional-chaining`

**Mulighet:** Erstatt de 3 separate plugins med `@babel/preset-env` i BABEL_OPTIONS. Da fjernes 3 pakker og du får én moderne konfigurering.

## 6. Øvrige mangler

- **Ingen `engines`-felt** i package.json — Node-versjon er ikke spesifisert
- **Ingen tester** — høy risiko ved oppgraderinger
- **ESLint 5.x** er kraftig utdatert (nåværende: v9.x)
- **Ingen `.npmrc`** på main — `develop` har privat GitHub Packages-registry oppsatt
- **Ingen `.npmignore`** på main — alt publiseres, inkludert docs/editor-config
- **Ingen tags** i git — vanskelig å spore hva som faktisk ble publisert

---

## Plan for B18 Release

### Fase 1: Stabiliser `main` (forutsetning)
1. Merge `develop` → `main` (inneholder alle bugfikser + pakkeoppdateringer)
2. Slett 5 stale brancher
3. Verifiser at `.npmrc`, `.npmignore`, `.editorconfig` er med

### Fase 2: Fjern teknisk gjeld
4. Slett 6 ubrukte pakker (`@babel/cli`, `@babel/preset-env`, `moment`, `winston`, `replace-in-file`, `tmp`)
5. Kjør `npm audit fix` — fikser ~20 av 30 sårbarheter automatisk
6. Oppdater gjenværende pakker til nyeste (spesielt `@babel/core` → 7.26+, `cldr`, `handlebars`, `marked`)

### Fase 3: Modernisering
7. Erstatt 3 Babel proposal-plugins med `@babel/preset-env` i BABEL_OPTIONS
8. Oppdater ESLint til v9.x (eller minst v8.x) med ny flat config
9. Legg til `"engines": { "node": ">=18" }` i package.json
10. Legg til git tags for release-versjonering

### Fase 4: Release
11. Sett versjon til `2.0.0-B18`
12. Test manuelt (alle task-typer: part/page/layout create, phrase check-missing, jsx-xml build)
13. Publiser til GitHub Packages
14. Tag `v2.0.0-B18` i git

---

## Mulige breaking changes ved oppgradering til B18

> B18 inkluderer alt fra `develop` (som noen kjenner som "B17") pluss ytterligere opprydding.
> Apper som i dag bruker B16 (fra `main`) har **størst migrasjonsbehov**. Apper på B17 (fra `develop`) vil ha en enklere overgang.

### For apper som oppgraderer fra B16 → B18

| Endring | Detalj | Påvirkning | Handling |
|---|---|---|---|
| **builtIns path endret** | `jsx-xml.js` leter nå etter Summary/Description/Image i `templates/jsx/` i stedet for `dist/components/` | Apper som bruker `<Summary>`, `<Description>`, `<Image>` i JSX-XML **vil feile** hvis de hadde en lokal `dist/components`-mappe | Ingen handling nødvendig — dette er en intern xptool-path. Men prosjekter med custom `dist/components` overrides mister dem |
| **Babel major bump** | `@babel/core` 7.11 → 7.23+ (B18 tar den videre til 7.26+) | JSX-XML transpilering kan gi **forskjellig output** for edge cases | Test `jsx-xml:build` på prosjektet. Sjekk at generert XML er identisk |
| **`phrase:check-missing` sjekker nå `<description>`-tagger** | Nye i18n-feil kan dukke opp som ikke ble rapportert før | Prosjekter kan få **nye warnings/errors** ved `phrase:check-missing` | Legg til manglende i18n-nøkler for `<description>` i XML-filer, eller ignorer dem |
| **`phrase:check-missing` fallback til build-path** | Hvis source XML ikke finnes, sjekker den nå `build/`-mappen | Prosjekter med JSX-XML som genererer XML kun i build-mappen **fungerer nå** (var feil i B16) | Positiv endring, men kan gi nye warnings for filer som tidligere ble ignorert |
| **`chokidar.watch()` options endret** | `jsx-xml:watch` og `subproject:watch` har nå `ignoreInitial: true` og throttle-innstillinger | Watcher **trigger ikke lenger på eksisterende filer** ved oppstart (kun nye/endrede) | Kjør `jsx-xml:build` eksplisitt først om du trenger initial compile |
| **`getObjectList()` returnerer nå `buildPath`** | Nytt felt i returverdien fra `xp.js` | Ingen breaking change, men prosjekter med custom scripts som parser output kan se ny data | Ingen handling nødvendig |
| **Ny `getSite()` funksjon i `xp.js`** | Brukes internt av `check-missing` | Ingen direkte påvirkning for brukere | Ingen handling nødvendig |

### For apper som oppgraderer fra B17 → B18

| Endring | Detalj | Påvirkning | Handling |
|---|---|---|---|
| **Babel 7.23 → 7.26+** | Mindre oppgradering, men inkluderer bugfix for `@babel/traverse` (kritisk CVE) | Svært lav risiko for breaking changes | Test `jsx-xml:build` |
| **Babel proposal-plugins erstattet med `@babel/preset-env`** | `plugin-proposal-nullish-coalescing-operator` og `plugin-proposal-optional-chaining` fjernes som separate pakker | Funksjonelt identisk — disse er innebygd i preset-env siden 7.14 | Ingen handling nødvendig |
| **6 ubrukte pakker fjernet** | `@babel/cli`, `moment`, `winston`, `replace-in-file`, `tmp`, `@babel/preset-env` (som separat pakke) | Ingen — disse ble aldri importert | Ingen handling nødvendig |
| **ESLint 5.x → 8.x/9.x** | Kun devDependency, påvirker ikke runtime | Ingen — dette er kun for utvikling av xptool selv | Ingen handling nødvendig |
| **Node >=18 krav** | `engines`-felt legges til i package.json | Apper med Node 16 **kan ikke installere** xptool B18 | Oppgrader til Node 18+ (Node 16 er EOL siden sept 2023) |

### Generelle oppgraderingsnotater for alle

1. **Kjør `jsx-xml:build` etter oppgradering** — Verifiser at generert XML er identisk med forrige versjon
2. **Kjør `phrase:check-missing`** — Forvent potensielt nye warnings pga. `<description>`-sjekk
3. **Sjekk `.xptool`-konfig** — B18 støtter `jsxXml.extension`-innstilling (default: `.xml.jsx`, alternativ: `.jsxxml`). Hvis prosjektet bruker `.jsxxml`-filer, legg til config:
   ```json
   { "jsxXml": { "extension": "alternative" } }
   ```
4. **Node-versjon** — Sørg for Node 18+ er installert
5. **Installer fra riktig kilde** — B18 publiseres til GitHub Packages (`@bouvet-apps` scope). Sjekk at `.npmrc` peker til riktig registry

---

## Publisering til GitHub Packages (npm)

### Kort svar

- npm-pakken er **ikke koblet direkte til en branch**.
- En publisert versjon i GitHub Packages er et snapshot av filene som ble publisert der og da.
- Branch og commit er kun indirekte relevant (du publiserer vanligvis fra en branch), men registry lagrer ikke "branch-tilknytning" som sannhetskilde.

### Anbefalt publiseringsflyt

1. Oppdater versjon i `package.json` (alltid unik versjon per release).
2. Kjør prepublish/build (`prepublishOnly` i dette prosjektet genererer dist + README).
3. Publiser til GitHub Packages (`npm.pkg.github.com`) for `@bouvet-apps`-scopet.
4. Tag samme commit i git med samme versjon (for eksempel `v2.0.0-B18`).
5. Verifiser at versjonen vises under Packages i GitHub.

### Hvordan versjonene lagres

- Hver `npm publish` lager en egen immutable pakkeversjon i registry.
- Samme versjonsnummer skal ikke gjenbrukes med nytt innhold.
- `dist-tags` (som `latest`) peker til en versjon og kan flyttes.
- Metadata i registry inkluderer versjon, publiseringstidspunkt, publiserer og manifest.

### Hvorfor B16/B17 ble forvirrende

- B16 og B17 ble i praksis produsert fra forskjellig kodehistorikk.
- Når branch-flyt og release-tagging ikke er stram, kan to miljøer bruke ulik kode med nesten lik versjonsforståelse.
- Dette løses med en fast release policy: publiser kun fra release-branch/main, unik versjon per publish, og obligatorisk git-tag per release.

### Feilsøkematrise for prosjekter som bruker B16/B17

| Symptom i prosjekt | Sannsynlig årsak | Sjekk/verifisering | Tiltak |
|---|---|---|---|
| `Summary`/`Description`/`Image` feiler ved transpile/compile | B16-lik kode som forventer built-ins fra `dist/components` | Sjekk installert `lib/jsx-xml/jsx-xml.js` for path til built-ins | Oppgrader til B18 og kjør full `jsx-xml:build` |
| `.jsxxml`-filer blir ikke plukket opp | B16 uten støtte for alternativ extension | Sjekk `lib/jsx-xml/constants.js` og `.xptool` config | Oppgrader og sett `jsxXml.extension: "alternative"` ved behov |
| `phrase:check-missing` rapporterer ikke alt i ett prosjekt, men gjør det i et annet | Forskjell mellom B16/B17 på `<description>`-sjekk og build fallback | Sammenlign output fra samme kommando mellom miljøene | Standardiser på B18 og re-kjør phrase-sjekk i alle miljøer |
| `phrase:check-missing` gir nye warnings etter oppgradering | B17/B18 avdekker reelle i18n-mangler som B16 ikke fant | Se om warning gjelder `<description>` eller generert XML | Legg til manglende i18n-nøkler og oppdater baseline |
| `jsx-xml:watch` reagerer annerledes ved oppstart | Endret chokidar-oppsett (`ignoreInitial`) i nyere gren | Sammenlign om initial scan trigges uten filendring | Kjør `jsx-xml:build` før watch for deterministisk initial state |
| Samme versjon (`2.0.0-B17`) oppfører seg ulikt mellom team | Ulikt faktisk pakkeinnhold bak samme versjonsforståelse | Sammenlign nøkkelfiler i installert pakke (`jsx-xml.js`, `constants.js`, `check-missing.js`) | Innfør streng release policy med unik versjon + git-tag |
| Installasjon feiler på enkelte miljøer med engine-feil | Node-versjon mismatch mot valgt B18-policy | Kjør `node -v` i pipeline/runtime og sammenlign med `engines` | Enten løft Node i miljøene eller velg Node16-kompatibel B18-profil |
| Ulik dokumentasjon/installasjonskommando i team | Scope/registry-forvirring (`@bouvet` vs `@bouvet-apps`) | Sjekk `package.json` name og `.npmrc` registry | Standardiser på `@bouvet-apps/xp-tool` og felles `.npmrc` |

### Hurtigsjekk per prosjekt (5 min)

1. Kjør `node -v` og noter versjon.
2. Kjør `npm ls @bouvet-apps/xp-tool` og noter eksakt installert versjon.
3. Kjør `xptool phrase:check-missing` og lagre output.
4. Kjør `xptool jsx-xml:build` og bekreft at genererte XML-filer oppdateres uten feil.
5. Hvis resultat avviker fra andre miljøer med "samme" versjon, sammenlign nøkkelfilene i installert pakke som nevnt i matrisen.
