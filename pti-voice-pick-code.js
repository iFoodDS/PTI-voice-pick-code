/**
 * PTI Voice Pick Code — browser drop-in
 *
 * Host this file on your own origin (for example producetraceability.org).
 * It does not load HarvestMark or any other third-party URL.
 *
 * Embed:
 *   <div id="pti-voice-pick-code"></div>
 *   <script src="/pti-voice-pick-code.js"></script>
 *
 * Programmatic:
 *   PTIVoicePickCode.generateVoiceCode({ gtin, lot, packDate })
 *
 * Copyright 2011-2026 iFoodDecisionSciences, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Keep the checksum in this file in sync with poc-library/src (crc16.js, validate.js, generate.js).
 */
(function (global) {
  "use strict";

  var CRC16_IBM_POLYNOMIAL = 0xa001;
  var LOT_PATTERN = /^[!"%&'()*+,\-./0-9:;<=>?A-Z_a-z]{1,20}$/;
  var STYLE_ID = "pti-vpc-styles";
  var mountCount = 0;

  function createCrc16Table() {
    var table = new Array(256);
    var i;
    var bit;
    var value;
    var temp;
    for (i = 0; i < 256; i += 1) {
      value = 0;
      temp = i;
      for (bit = 0; bit < 8; bit += 1) {
        if ((value ^ temp) & 1) {
          value = (value >> 1) ^ CRC16_IBM_POLYNOMIAL;
        } else {
          value >>= 1;
        }
        temp >>= 1;
      }
      table[i] = value;
    }
    return table;
  }

  var CRC16_TABLE = createCrc16Table();

  function crc16(input) {
    var crc = 0;
    var i;
    var index;
    for (i = 0; i < input.length; i += 1) {
      index = (crc ^ input.charCodeAt(i)) % 256;
      crc = (crc >> 8) ^ CRC16_TABLE[index];
    }
    return crc;
  }

  function VoiceCodeValidationError(message, field) {
    var err = new Error(message);
    err.name = "VoiceCodeValidationError";
    err.field = field;
    return err;
  }

  function isNumeric(value) {
    return /^[0-9]+$/.test(value);
  }

  function validateGtin(gtin) {
    if (typeof gtin !== "string" || gtin.length !== 14) {
      throw VoiceCodeValidationError("A GTIN must be 14 digits long.", "gtin");
    }
    if (!isNumeric(gtin)) {
      throw VoiceCodeValidationError("Only numbers 0-9 are allowed in a GTIN.", "gtin");
    }
  }

  function validateLot(lot) {
    if (typeof lot !== "string" || lot.length === 0) {
      throw VoiceCodeValidationError("A lot code is required.", "lot");
    }
    if (lot.length > 20) {
      throw VoiceCodeValidationError("A lot code cannot be longer than 20 characters.", "lot");
    }
    if (!LOT_PATTERN.test(lot)) {
      throw VoiceCodeValidationError(
        "Invalid characters found in lot code. Only A-Z, a-z, 0-9, and ! \" % & ' ( ) * + , - . / : ; < = > ? _ are allowed.",
        "lot"
      );
    }
  }

  function validatePackDate(packDate) {
    if (packDate == null || packDate === "") {
      return;
    }
    if (typeof packDate !== "string" || packDate.length !== 6 || !isNumeric(packDate)) {
      throw VoiceCodeValidationError("Please enter a date in the format YYMMDD.", "packDate");
    }
    var year = 2000 + Number(packDate.slice(0, 2));
    var monthIndex = Number(packDate.slice(2, 4)) - 1;
    var day = Number(packDate.slice(4, 6));
    var parsed = new Date(year, monthIndex, day);
    if (year % 100 !== parsed.getFullYear() % 100 || parsed.getMonth() !== monthIndex || parsed.getDate() !== day) {
      throw VoiceCodeValidationError(
        "An invalid date was given. Please try again using the format YYMMDD.",
        "packDate"
      );
    }
  }

  function generateVoiceCode(input) {
    var gtin = input && input.gtin;
    var lot = input && input.lot;
    var packDate = (input && input.packDate) || "";
    validateGtin(gtin);
    validateLot(lot);
    validatePackDate(packDate);
    var payload = String(gtin) + String(lot) + String(packDate);
    var code = String(crc16(payload) % 10000);
    while (code.length < 4) {
      code = "0" + code;
    }
    return {
      code: code,
      minor: code.slice(0, 2),
      major: code.slice(2, 4),
      payload: payload
    };
  }

  var CSS_TEXT =
    ".pti-vpc{width:220px;margin:0;padding:8px 8px 6px;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111;border:0;box-sizing:border-box}" +
    ".pti-vpc *{box-sizing:border-box}" +
    ".pti-vpc-title{margin:0 0 6px;text-align:center;font-size:12px;font-weight:700}" +
    ".pti-vpc-row{clear:both;margin:2px 0;overflow:hidden}" +
    ".pti-vpc-row label{float:left;width:32%;margin-top:4px;font-size:10px}" +
    ".pti-vpc-row input[type=text]{width:64%;border:1px solid #111;font-size:11px;padding:2px 4px}" +
    ".pti-vpc-hint{float:right;width:64%;margin:0 0 4px;font-size:10px;color:#444}" +
    ".pti-vpc-hint em{font-style:italic}" +
    ".pti-vpc-actions{margin-top:8px;overflow:hidden}" +
    ".pti-vpc-actions button{float:left;width:58%;margin:0 8px 0 0;padding:4px 6px;border:1px solid #888;background:#ccc;font-size:12px;cursor:pointer}" +
    ".pti-vpc-code{float:left;visibility:hidden;background:#000;color:#fff;font-weight:700;padding:1px 5px}" +
    ".pti-vpc-code.is-visible{visibility:visible}" +
    ".pti-vpc-minor{font-size:12px}" +
    ".pti-vpc-major{font-size:24px}" +
    ".pti-vpc-error{clear:both;min-height:1.2em;margin:6px 0 0;font-size:11px;color:#a40000}" +
    ".pti-vpc-credit{clear:both;margin:6px 0 0;font-size:9px;color:#333}";

  function injectStyles() {
    if (typeof document === "undefined") {
      return;
    }
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.type = "text/css";
    style.appendChild(document.createTextNode(CSS_TEXT));
    (document.head || document.getElementsByTagName("head")[0] || document.documentElement).appendChild(style);
  }

  function bindInputReset(input, hideCode, errorEl) {
    input.addEventListener("keydown", function () {
      hideCode();
      errorEl.textContent = "";
    });
    input.addEventListener("input", function () {
      hideCode();
      errorEl.textContent = "";
    });
  }

  function mount(target) {
    if (!target) {
      return null;
    }
    if (typeof target === "string") {
      target = document.querySelector(target);
    }
    if (!target) {
      return null;
    }
    if (target.getAttribute("data-pti-vpc-mounted") === "true") {
      return target;
    }

    injectStyles();
    mountCount += 1;
    var uid = "pti-vpc-" + mountCount;

    target.setAttribute("data-pti-vpc-mounted", "true");
    target.innerHTML =
      '<form class="pti-vpc" action="#">' +
      '<div class="pti-vpc-title">PTI Voice Pick Code Calculator</div>' +
      '<div class="pti-vpc-row"><label for="' + uid + '-gtin">GTIN:</label>' +
      '<input id="' + uid + '-gtin" name="gtin" type="text" maxlength="14" size="16" autocomplete="off" /></div>' +
      '<div class="pti-vpc-row"><label for="' + uid + '-lot">Lot Code:</label>' +
      '<input id="' + uid + '-lot" name="lot" type="text" maxlength="20" size="16" autocomplete="off" /></div>' +
      '<div class="pti-vpc-row"><label for="' + uid + '-date">Pack Date:</label>' +
      '<input id="' + uid + '-date" name="packDate" type="text" maxlength="6" size="6" autocomplete="off" /></div>' +
      '<div class="pti-vpc-hint">YYMMDD (<em>Optional</em>)</div>' +
      '<div class="pti-vpc-actions">' +
      '<button type="submit">Generate Code</button>' +
      '<span class="pti-vpc-code" id="' + uid + '-code">' +
      '<span class="pti-vpc-minor" id="' + uid + '-minor">00</span>' +
      '<span class="pti-vpc-major" id="' + uid + '-major">00</span></span></div>' +
      '<div class="pti-vpc-error" id="' + uid + '-error"></div>' +
      '<div class="pti-vpc-credit">PTI voice pick code</div>' +
      "</form>";

    var form = target.querySelector("form");
    var gtinInput = document.getElementById(uid + "-gtin");
    var lotInput = document.getElementById(uid + "-lot");
    var dateInput = document.getElementById(uid + "-date");
    var codeEl = document.getElementById(uid + "-code");
    var minorEl = document.getElementById(uid + "-minor");
    var majorEl = document.getElementById(uid + "-major");
    var errorEl = document.getElementById(uid + "-error");

    function hideCode() {
      codeEl.className = "pti-vpc-code";
      minorEl.textContent = "00";
      majorEl.textContent = "00";
    }

    bindInputReset(gtinInput, hideCode, errorEl);
    bindInputReset(lotInput, hideCode, errorEl);
    bindInputReset(dateInput, hideCode, errorEl);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      errorEl.textContent = "";
      try {
        var result = generateVoiceCode({
          gtin: gtinInput.value,
          lot: lotInput.value,
          packDate: dateInput.value
        });
        minorEl.textContent = result.minor;
        majorEl.textContent = result.major;
        codeEl.className = "pti-vpc-code is-visible";
      } catch (err) {
        hideCode();
        errorEl.textContent = err.message || String(err);
      }
    });

    return target;
  }

  function mountAll() {
    var nodes = [];
    var byId = document.getElementById("pti-voice-pick-code");
    if (byId) {
      nodes.push(byId);
    }
    var extras = document.querySelectorAll("[data-pti-voice-pick-code]");
    var i;
    for (i = 0; i < extras.length; i += 1) {
      if (extras[i] !== byId) {
        nodes.push(extras[i]);
      }
    }
    for (i = 0; i < nodes.length; i += 1) {
      mount(nodes[i]);
    }
  }

  function boot() {
    mountAll();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  var api = {
    generateVoiceCode: generateVoiceCode,
    crc16: crc16,
    mount: mount,
    mountAll: mountAll,
    VoiceCodeValidationError: VoiceCodeValidationError
  };

  global.PTIVoicePickCode = api;
})(typeof window !== "undefined" ? window : this);
