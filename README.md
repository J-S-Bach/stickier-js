# stickier-js

**👏👏 This package is a fork of rgalus (biuro@rafalgalus.pl) [sticky.js](https://github.com/rgalus/sticky-js). Most of the code is written by them. 👏👏**

> Sticky-js is a library for sticky elements written in vanilla javascript. With this library you can easily set sticky elements on your website. It's also responsive.

## Features

- Written in typescript, compiled to vanilla JavaScript with additional types, no dependencies needed
- Lightweight (minified: ~8.4kb, gzipped: ~2.5kb)
- It can be sticky to the entire page or to selected parent container
- No additional CSS needed

## Install

```
npm install stickier-js
```

## Methods

Update sticky, e.g. when parent container (data-sticky-container) change height

```js
var sticky = new Sticky(".sticky");

// and when parent change height..
sticky.update();
```

Destroy sticky element

```js
var sticky = new Sticky(".sticky");

sticky.destroy();
```

## Available options

| Option            | Type    | Default | Description                                                                                                                         |
| ----------------- | ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| data-sticky-wrap  | boolean | false   | When it's `true` sticky element is wrapped in `<span></span>` which has sticky element dimensions. Prevents content from "jumping". |
| data-margin-top   | number  | 0       | Margin between page and sticky element when scrolled                                                                                |
| data-sticky-for   | number  | 0       | Breakpoint which when is bigger than viewport width, sticky is activated and when is smaller, then sticky is destroyed              |
| data-sticky-class | string  | null    | Class added to sticky element when it is stuck                                                                                      |

### Development

Clone this repository and run

I am not planning to actively maintain this repository. I will update this repo if I need something and I am happy to review your PR, but I will not work on your issue. 

```js
npm start
```

## Browser Compatibility

Library is using ECMAScript 5 features.

- IE 9+
- Chrome 23+
- Firefox 21+
- Safari 6+
- Opera 15+

If you need this library working with older browsers you should use ECMAScript 5 polyfill.

[Full support](http://caniuse.com/#search=ECMAScript%205)

---

### License

[MIT License](https://github.com/J-S-Bach/stickier-js/blob/master/LICENSE)
