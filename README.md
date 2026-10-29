# PTI Voice Pick Code Calculator

An open-source calculator for the **Produce Traceability Initiative (PTI) Voice Pick Code**: a 4-digit code computed from a case's GTIN, lot code and optional pack date, printed on PTI case labels so warehouse staff on voice-picking systems can confirm GTIN and lot by speaking four digits.

- One self-contained JavaScript file. No server, no build step, no third-party calls.
- Produces the same codes as the original HarvestMark/YottaMark calculator and the published Voice Pick Code specification.
- Licensed under [Apache 2.0](LICENSE).

## Quick start

Copy `pti-voice-pick-code.js` to your web server and add two lines to any page:

```html
<div id="pti-voice-pick-code"></div>
<script src="/pti-voice-pick-code.js"></script>
```

The form (GTIN, Lot Code, Pack Date, Generate Code) renders inside the `div`. Styles are injected by the script; `pti-voice-pick-code.css` is an optional copy if you prefer to manage styles yourself. Open `index.html` locally to see a working example.

To place more than one calculator on a page, add `data-pti-voice-pick-code` to each container:

```html
<div data-pti-voice-pick-code></div>
```

## Use it from code

The script exposes `window.PTIVoicePickCode`:

```javascript
const result = PTIVoicePickCode.generateVoiceCode({
  gtin: "00012345678905",
  lot: "LOT42",
  packDate: "260922" // optional, YYMMDD
});
// { code: "2228", minor: "22", major: "28", payload: "00012345678905LOT42260922" }
```

Invalid input throws an error with `name === "VoiceCodeValidationError"` and a `field` property (`gtin`, `lot` or `packDate`).

| Function | Purpose |
| --- | --- |
| `generateVoiceCode({ gtin, lot, packDate })` | Validate inputs and return the code |
| `crc16(string)` | The underlying CRC-16 checksum |
| `mount(elementOrSelector)` | Render the calculator into an element |
| `mountAll()` | Render into every matching container on the page |

## How the code is calculated

1. **Validate**
   - GTIN: exactly 14 digits.
   - Lot code: 1–20 characters from `A–Z a–z 0–9` and `! " % & ' ( ) * + , - . / : ; < = > ? _`
   - Pack date (optional): a valid calendar date as `YYMMDD`.
2. **Concatenate** GTIN + lot + pack date (no spaces, no GS1 application identifiers).
3. **Hash** the ASCII string with CRC-16 (polynomial x¹⁶ + x¹⁵ + x² + 1, reflected form `0xA001`, initial value 0).
4. **Reduce** to `crc % 10000`, left-padded to four digits.
5. **Print** the first two digits small and the last two digits large on the label.

## Test vectors

Any implementation should produce these codes:

| GTIN | Lot code | Pack date | Code |
| --- | --- | --- | --- |
| 10850510002011 | 46587443HG234 | — | 6359 |
| 00012345678905 | LOT42 | — | 2791 |
| 00012345678905 | LOT42 | 260922 | 2228 |
| 01234567890128 | A1! | 991231 | 4839 |
| 10614141543219 | 123456 | 030217 | 4378 |

The first row is the worked example from the 2013 Voice Pick Code white paper.

## Browser support

Plain ES5 JavaScript; works in all current browsers. Nothing is sent over the network: codes are computed on the user's device.

## Contributing

Issues and pull requests are welcome. Changes to the calculation must keep every test vector above passing, since codes already printed on labels in the field depend on it.

## License

Copyright 2011–2026 iFoodDecisionSciences, Inc.

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

The calculator was first developed in 2011 by YottaMark, Inc. (HarvestMark), which is now part of iFoodDecisionSciences, Inc. iFoodDecisionSciences holds the full copyright, so no separate YottaMark notice is required.

The license does not grant trademark rights. HarvestMark, VoiceCode and YottaMark are trademarks of their respective owners. GS1 and PTI names are used only to describe the Produce Traceability Initiative guidance this code implements.

## Background

- [PTI Voice Pick Code calculator](https://producetraceability.org/voice-pick-code-calculator/)
- [Voice Pick Code white paper (2013)](https://www.produceinventory.com/files/newsroom/Voice-Pick-Code.pdf)
