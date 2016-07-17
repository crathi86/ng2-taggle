import {Component, ViewChild, Input, SimpleChange} from "@angular/core";
import {FORM_DIRECTIVES, FORM_PROVIDERS} from "@angular/forms";

@Component({
  moduleId: __filename,
  selector: "ng2-taggle",
  styleUrls: [
    "ng2-taggle.style.css"
  ],
  templateUrl: "ng2-taggle.template.html",
  directives: [FORM_DIRECTIVES],
  providers: [FORM_PROVIDERS]
})
export class Taggle {
  static BACKSPACE = 8;
  static COMMA = 188;
  static TAB = 9;
  static ENTER = 13;

  @ViewChild("input") input;
  @ViewChild("sizer") sizer;
  @ViewChild("container") container;
  @ViewChild("placeholder") placeholder;
  @ViewChild("list") list;

  @Input("property") tagName = "name";
  @Input("name") field = "tags";
  @Input("tags") _tags: any[] = [];

  tags: any[] = [];

  pasting = false;

  measurements = {
              container: {
                  rect: undefined,
                  style: undefined,
                  padding: undefined
              }
          };

  settings: any = {
    submitKeys : [],
    allowDuplicates: false,
    tagFormatter: undefined,
    onTagAdd: undefined,
    onTagRemove: undefined,
    onBeforeTagRemove: undefined,
    containerFocusClass: "active",
    saveOnBlur: false,
    maxTags: undefined
  };

  constructor() {
    if (!this.settings.submitKeys.length) {
      this.settings.submitKeys = [Taggle.COMMA, Taggle.TAB, Taggle.ENTER];
    }
  }

  ngAfterViewInit() {
    this._on(this.container.nativeElement, "click", this._focusInput.bind(this));
    this._on(this.list.nativeElement, "click", this._focusInput.bind(this));
    this._on(this.input.nativeElement, "focus", this._focusInput.bind(this));
    this._on(this.input.nativeElement, "blur", this._blurEvent.bind(this));
    this._on(this.input.nativeElement, "keydown", this._keydownEvents.bind(this));
    this._on(this.input.nativeElement, "keyup", this._keyupEvents.bind(this));
  }

  ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    if (changes["_tags"]) {
      this.tags = changes["_tags"].currentValue.map((item) => {
         return {item: item};
      });
    }
  }

  _updateTags () {
    this._tags = this.tags.map((tag) => {
       return tag.item;
    });
  }

  _focusInput() {
    this._fixInputWidth();

    if (!this.container.nativeElement.classList.contains(this.settings.containerFocusClass)) {
      this.container.nativeElement.classList.add(this.settings.containerFocusClass);
    }

    if (this.placeholder) {
      this.placeholder.nativeElement.style.opacity = 0;
    }
    this.input.nativeElement.focus();
  }

  _blurEvent(e) {
    if (this.container.nativeElement.classList.contains(this.settings.containerFocusClass)) {
        this.container.nativeElement.classList.remove(this.settings.containerFocusClass);
    }

    if (!this.tags.length && this.placeholder) {
        this.placeholder.nativeElement.style.opacity = 1;
    }

    if (this.settings.saveOnBlur) {
      e = e || window.event;

      this._listenForEndOfContainer();

      if (this.input.nativeElement.value !== "") {
          this._confirmValidTagEvent(e);
          return;
      }

      if (this.tags.length) {
          this._checkLastTag(e);
      }
    }
    else {
      this.input.nativeElement.value = "";
      this._setInputWidth(undefined);
    }
  }


  _keydownEvents(e) {
    e = e || window.event;

    let key = e.keyCode;
    this.pasting = false;

    this._listenForEndOfContainer();

    if (key === 86 && e.metaKey) {
        this.pasting = true;
    }

    if (this._isConfirmKey(key) && this.input.nativeElement.value !== "") {
        this._confirmValidTagEvent(e);
        return;
    }

    if (this.tags.length) {
        this._checkLastTag(e);
    }
  };


  _keyupEvents(e) {
    e = e || window.event;

    this.input.nativeElement.classList.remove("taggle_back");

    this._setText(this.sizer.nativeElement, this.input.nativeElement.value);

    if (this.pasting && this.input.nativeElement.value !== "") {
        this._add(e, undefined);
        this.pasting = false;
    }
  }

  _checkLastTag(e) {
    e = e || window.event;

    let taggles = this.container.nativeElement.querySelectorAll(".taggle");
    let lastTaggle = taggles[taggles.length - 1];
    let hotClass = "taggle_hot";
    let heldDown = this.input.nativeElement.classList.contains("taggle_back");

    // prevent holding backspace from deleting all tags
    if (this.input.nativeElement.value === "" && e.keyCode === Taggle.BACKSPACE && !heldDown) {
        if (lastTaggle.classList.contains(hotClass)) {
          this.input.nativeElement.classList.add("taggle_back");
          // this._remove(lastTaggle, e);
          this._fixInputWidth();
          this._focusInput();
        }
        else {
          lastTaggle.classList.add(hotClass);
        }
    }
    else if (lastTaggle.classList.contains(hotClass)) {
        lastTaggle.classList.remove(hotClass);
    }
  }

   _trim(str) {
       return str.replace(/^\s+|\s+$/g, "");
   }

  _setText(el, text) {
       el.textContent = text;
   }


  _on(element, eventName, handler) {
    if (element.addEventListener) {
        element.addEventListener(eventName, handler, false);
    }
    else if (element.attachEvent) {
        element.attachEvent("on" + eventName, handler);
    }
    else {
        element["on" + eventName] = handler;
    }
  }

  _fixInputWidth() {
    this._getMeasurements();

    let width;
    let inputRect;
    let rect;
    let leftPos;
    let padding;

    // Reset width incase we've broken to the next line on a backspace erase
    this._setInputWidth(undefined);

    inputRect = this.input.nativeElement.getBoundingClientRect();
    rect = this.measurements.container.rect;
    width = ~~rect.width;
    // Could probably just use right - left all the time
    // but eh, this check is mostly for IE8
    if (!width) {
        width = ~~rect.right - ~~rect.left;
    }
    leftPos = ~~inputRect.left - ~~rect.left;
    padding = this.measurements.container.padding;

    this._setInputWidth(width - leftPos - padding);
  }

  _getMeasurements() {
    let style;
    let lpad;
    let rpad;

    this.measurements.container.rect = this.container.nativeElement.getBoundingClientRect();
    this.measurements.container.style = window.getComputedStyle(this.container.nativeElement);

    style = this.measurements.container.style;
    lpad = parseInt(style["padding-left"] || style.paddingLeft, 10);
    rpad = parseInt(style["padding-right"] || style.paddingRight, 10);

    this.measurements.container.padding = lpad + rpad;
  }

  _setInputWidth(width) {
    this.input.nativeElement.style.width = (width || 10) + "px";
  }

  _listenForEndOfContainer() {
    let width = this.sizer.nativeElement.getBoundingClientRect().width;
    let max = this.measurements.container.rect.width - this.measurements.container.padding;
    let size = parseInt(this.sizer.nativeElement.style.fontSize, 10);

    // 1.5 just seems to be a good multiplier here
    if (width + (size * 1.5) > parseInt(this.input.nativeElement.style.width, 10)) {
      this.input.nativeElement.style.width = max + "px";
    }
  }

  confirmValidTagEvent(e) {
    e = e || window.event;

    // prevents from jumping out of textarea
    if (e.preventDefault) {
        e.preventDefault();
    }
    else {
        e.returnValue = false;
    }

    this._add(e, undefined);
  }

  _add(e, text) {
    let values = text || "";

    if (typeof text !== "string") {
        values = this._trim(this.input.nativeElement.value);
    }

    values.split(",").map((val) => {
        return this._formatTag(val);
    }).forEach((val) => {
      if (!this._canAdd(e, val)) {
        return;
      }

      this.tags.push({ item: {[this.tagName]: val} });
      this._updateTags();

      val = this.tags[this.tags.length - 1];

      if (this.settings.onTagAdd) this.settings.onTagAdd(e, val);

      setTimeout(() => {
        this.input.nativeElement.value = "";
        this._setInputWidth(undefined);
        this._focusInput();
        this._fixInputWidth();
      });
    });
  }

  _formatTag(text) {
    return this.settings.preserveCase ? text : text.toLowerCase();
  }

  _canAdd(e, text) {
    if (!text) {
        return false;
    }
    let limit = this.settings.maxTags;
    if (limit !== null && limit <= this.tags.length) {
        return false;
    }

    if (this.settings.onBeforeTagAdd && this.settings.onBeforeTagAdd(e, text) === false) {
        return false;
    }

    if (!this.settings.allowDuplicates && this._hasDupes(text)) {
        return false;
    }

    let sensitive = this.settings.preserveCase;
    let allowed = this.settings.allowedTags;

    if (allowed && allowed.length && !this._tagIsInArray(text, allowed, sensitive)) {
        return false;
    }

    let disallowed = this.settings.disallowedTags;
    if (disallowed && disallowed.length && this._tagIsInArray(text, disallowed, sensitive)) {
        return false;
    }

    return true;
  }

  _confirmValidTagEvent(e) {
    e = e || window.event;

    // prevents from jumping out of textarea
    if (e.preventDefault) {
        e.preventDefault();
    }
    else {
        e.returnValue = false;
    }

    this._add(e, undefined);
  }

  _isConfirmKey(key) {
    let confirmKey = false;

    if (this.settings.submitKeys.indexOf(key) > -1) {
        confirmKey = true;
    }

    return confirmKey;
  }

  _createTag(text) {
    let li = document.createElement("li");
    let close = document.createElement("button");
    let hidden = document.createElement("input");
    let span = document.createElement("span");

    text = this._formatTag(text);

    close.innerHTML = "&times;";
    close.className = "close";
    close.type = "button";
    // this._on(close, "click", this._remove.bind(this, close));

    this._setText(span, text);
    span.className = "taggle_text";

    li.className = "taggle " + this.settings.additionalTagClasses;

    hidden.type = "hidden";
    hidden.value = text;
    hidden.name = this.settings.hiddenInputName;

    li.appendChild(span);
    li.appendChild(close);
    li.appendChild(hidden);

    if (this.settings.tagFormatter) {
      let formatted = this.settings.tagFormatter(li);

      if (typeof formatted !== "undefined") {
          li = formatted;
      }
    }

    if (!(li instanceof HTMLElement) || li.tagName !== "LI") {
        throw new Error("tagFormatter must return an li element");
    }

    this.tags.push({ [this.tagName]: text});
    // this.tag.elements.push(li);

    return li;
  }

  _remove(index, e) {
    let tagRemoved = this.tags.splice(index, 1);

    if (this.settings.onTagRemove) this.settings.onTagRemove(e, tagRemoved);

    this._focusInput();

    this._updateTags();
  }

  _tagIsInArray(text, arr, caseSensitive) {
    if (caseSensitive) {
        return arr.indexOf(text) !== -1;
    }

    let lowercased = [].slice.apply(arr).map(function(str) {
        return str.toLowerCase();
    });

    return lowercased.indexOf(text) !== -1;
  }

  _hasDupes(text) {
    let result = this.tags.find((tag) => {
      return (tag.item[this.tagName] === text);
    });
    if (result) {
      result.duplicate = false;
      setTimeout(() => {
        result.duplicate = true;
        setTimeout(() => {
          result.duplicate = false;
        }, 1000);
      }, 50);
    }
    return result !== undefined;
  }
}
