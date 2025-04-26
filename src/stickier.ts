//TODO: Autogenerate

/**
 * Sticky.js
 * Library for sticky elements written in vanilla javascript. With this library you can easily set sticky elements on your website. It's also responsive.
 *
 * @version 0.0.1
 * @author J-S-Bach
 * @website https://github.com/J-S-Bach/stickier-js
 * @repo https://github.com/J-S-Bach/stickier-js
 * @license https://github.com/J-S-Bach/stickier-js/blob/master/LICENSE
 */

type SelectableElement = string | HTMLElement | NodeListOf<HTMLElement>;

type FinalRenderElement = HTMLElement & NothingNullable<AdditionalElementProps>;

type Rectangle = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type NothingNullable<T> = T extends Object
  ? T extends Function
    ? NonNullable<T>
    : {
        [P in keyof T]-?: NothingNullable<T[P]>;
      }
  : NonNullable<T>;

type Options = {
  /**
   * Adds a wrapper element for the stickier element. The wrapper element is determined with wrapWith. Defaults to false
   */
  wrap: boolean;
  /**
   * Element that wraps the stickier element. Only useful if wrap is true. Defaults to `span`
   */
  wrapWith: string;
  /**
   * Top margin of wrapper element
   */
  marginTop: number;
  /**
   * Bottom margin of wrapper element
   */
  marginBottom: number;
  /**
   * Amount of space in px that the stickier element is sticking to.
   */
  stickyFor: number;
  /**
   * Adds class to stickier element.
   */
  stickyClass: string | null;
  //TODO: Add support for Element. Currently is queryString for domElement
  /**
   * QueryString to search for a container for the stickier element.
   */
  stickyContainer: string;
};

type AdditionalElementProps = {
  sticky?: {
    onResize?: () => void;
    onScroll?: () => void;
    active?: boolean;
    marginTop?: number;
    marginBottom?: number;
    stickyFor?: number;
    stickyClass?: string | null;
    wrap?: boolean;
    stickyContainer?: string;
    container?: HTMLElement | null;
    containerRect?: Rectangle;
    rect?: Rectangle;
    scrollTop?: number;
  };
};

const consoleWarn = (...messages: any[]) =>
  console.warn("sticker-js warn:", ...messages);

class Stickier {
  rawElements: HTMLElement[] = [];
  finalElements: FinalRenderElement[];
  version: string;
  vp: {
    width: number;
    height: number;
  };
  body: HTMLBodyElement | null = null;
  options: Options;
  scrollTop = 0;

  /**
   * Sticky instance constructor
   * @constructor
   * @param {string} selector - Selector which we can find elements
   * @param {string} options - Global options for sticky elements (could be overwritten by data-{option}="" attributes)
   */
  constructor(selector: SelectableElement, options: Partial<Options> = {}) {
    let elements: HTMLElement[];

    if (typeof selector === "string") {
      // Apparently its fine to type result of querySelectorAll as HTMLElement
      elements = [...document.querySelectorAll(selector)] as HTMLElement[];
    } else if (selector instanceof HTMLElement) {
      elements = [selector];
    } else if (selector.length !== undefined) {
      elements = [...selector];
    } else {
      elements = [];
      consoleWarn("Has been initialized without any targets.");
    }

    this.rawElements = elements;

    this.finalElements = [];

    this.version = "1.3.0";

    this.vp = this.getViewportSize();
    this.body = document.querySelector("body");

    this.options = {
      wrap: options.wrap || true,
      wrapWith: options.wrapWith || "<span></span>",
      marginTop: options.marginTop || 0,
      marginBottom: options.marginBottom || 0,
      stickyFor: options.stickyFor || 0,
      stickyClass: options.stickyClass || null,
      stickyContainer: options.stickyContainer || "body",
    };

    this.updateScrollTopPosition = this.updateScrollTopPosition.bind(this);

    this.updateScrollTopPosition();
    window.addEventListener("load", this.updateScrollTopPosition);
    window.addEventListener("scroll", this.updateScrollTopPosition);

    this.run();
  }

  /**
   * Function that waits for page to be fully loaded and then renders & activates every sticky element found with specified selector
   * @function
   */
  run() {
    // wait for page to be fully loaded
    const pageLoaded = setInterval(() => {
      if (document.readyState === "complete") {
        clearInterval(pageLoaded);

        this.rawElements.forEach((element) => {
          this.renderElement(element);
        });
      }
    }, 10);
  }

  /**
   * Function that assign needed variables for sticky element, that are used in future for calculations and other
   * @function
   * @param {node} element - Element to be rendered
   */
  renderElement(element: HTMLElement) {
    const enrichableElement: HTMLElement & AdditionalElementProps = element;

    // create container for variables needed in future
    enrichableElement.sticky = {};

    // set default variables
    enrichableElement.sticky.active = false;

    const attributeMarginTop = element.getAttribute("data-margin-top");
    const attributeMarginBottom = element.getAttribute("data-margin-bottom");
    const attributeStickyForm = element.getAttribute("data-sticky-for");
    const attributeStickyClass = element.getAttribute("data-sticky-class");
    const attributeHasWrap = element.hasAttribute("data-sticky-wrap");

    enrichableElement.sticky.marginTop = attributeMarginTop
      ? parseInt(attributeMarginTop)
      : this.options.marginTop;

    enrichableElement.sticky.marginBottom = attributeMarginBottom
      ? parseInt(attributeMarginBottom)
      : this.options.marginBottom;

    enrichableElement.sticky.stickyFor = attributeStickyForm
      ? parseInt(attributeStickyForm)
      : this.options.stickyFor;

    enrichableElement.sticky.stickyClass = attributeStickyClass
      ? attributeStickyClass
      : this.options.stickyClass;

    enrichableElement.sticky.wrap = attributeHasWrap ? true : this.options.wrap;
    // @todo attribute for stickyContainer
    // element.sticky.stickyContainer = element.getAttribute('data-sticky-container') || this.options.stickyContainer;
    enrichableElement.sticky.stickyContainer = this.options.stickyContainer;

    enrichableElement.sticky.container = this.getStickyContainer(
      enrichableElement as FinalRenderElement
    );

    enrichableElement.sticky.containerRect = this.getRectangle(
      enrichableElement.sticky.container
    );

    enrichableElement.sticky.rect = this.getRectangle(enrichableElement);

    // fix when element is image that has not yet loaded and width, height = 0
    if (element.tagName.toLowerCase() === "img") {
      element.onload = () => {
        enrichableElement.sticky = {
          ...(enrichableElement.sticky as NonNullable<
            (typeof enrichableElement)["sticky"]
          >),
          rect: this.getRectangle(element),
        };
      };
    }

    if (enrichableElement.sticky.wrap) {
      this.wrapElement(element);
    }

    // activate rendered element
    this.activate(enrichableElement as FinalRenderElement);
  }

  /**
   * Wraps element into placeholder element
   * @function
   * @param {node} element - Element to be wrapped
   */
  wrapElement(element: HTMLElement) {
    element.insertAdjacentHTML(
      "beforebegin",
      element.getAttribute("data-sticky-wrapWith") || this.options.wrapWith
    );

    if (element.previousSibling === null) {
      consoleWarn("'element.previousSibling' not existing on node", element);
    }

    element.previousSibling?.appendChild(element);
  }

  /**
   * Function that activates element when specified conditions are met and then initalise events
   * @function
   * @param {node} element - Element to be activated
   */
  activate(element: FinalRenderElement) {
    if (
      element.sticky.rect.top + element.sticky.rect.height <
        element.sticky.containerRect.top +
          element.sticky.containerRect.height &&
      element.sticky.stickyFor < this.vp.width &&
      !element.sticky.active
    ) {
      element.sticky.active = true;
    }

    if (this.finalElements.indexOf(element) < 0) {
      this.finalElements.push(element);
    }

    if (!element.sticky.onResize) {
      this.initResizeEvents(element);
    }

    if (!element.sticky.onScroll) {
      this.initScrollEvents(element);
    }

    this.setPosition(element);
  }

  /**
   * Function which is adding onResizeEvents to window listener and assigns function to element as resizeListener
   * @function
   * @param {node} element - Element for which resize events are initialised
   */
  initResizeEvents(element: FinalRenderElement) {
    element.sticky.onResize = () => this.onResizeEvents(element);
    window.addEventListener("resize", element.sticky.onResize);
  }

  /**
   * Removes element listener from resize event
   * @function
   * @param {node} element - Element from which listener is deleted
   */
  destroyResizeEvents(element: FinalRenderElement) {
    window.removeEventListener("resize", element.sticky.onResize);
  }

  /**
   * Function which is fired when user resize window. It checks if element should be activated or deactivated and then run setPosition function
   * @function
   * @param {node} element - Element for which event function is fired
   */
  onResizeEvents(element: FinalRenderElement) {
    this.vp = this.getViewportSize();

    //Do resizing stuff if we know where the correct position would be. What we only know if wrapping is active
    if (element.sticky.wrap) {
      element.sticky.rect = this.getRectangle(element.parentElement!);
    }

    element.sticky.containerRect = this.getRectangle(element.sticky.container);

    if (
      element.sticky.rect.top + element.sticky.rect.height <
        element.sticky.containerRect.top +
          element.sticky.containerRect.height &&
      element.sticky.stickyFor < this.vp.width &&
      !element.sticky.active
    ) {
      element.sticky.active = true;
    } else if (
      element.sticky.rect.top + element.sticky.rect.height >=
        element.sticky.containerRect.top +
          element.sticky.containerRect.height ||
      (element.sticky.stickyFor >= this.vp.width && element.sticky.active)
    ) {
      element.sticky.active = false;
    }

    this.setPosition(element);
  }

  /**
   * Function which is adding onScrollEvents to window listener and assigns function to element as scrollListener
   * @function
   * @param {node} element - Element for which scroll events are initialised
   */
  initScrollEvents(element: FinalRenderElement) {
    element.sticky.onScroll = () => this.onScrollEvents(element);
    window.addEventListener("scroll", element.sticky.onScroll);
  }

  /**
   * Removes element listener from scroll event
   * @function
   * @param {node} element - Element from which listener is deleted
   */
  destroyScrollEvents(element: FinalRenderElement) {
    window.removeEventListener("scroll", element.sticky.onScroll);
  }

  /**
   * Function which is fired when user scroll window. If element is active, function is invoking setPosition function
   * @function
   * @param {node} element - Element for which event function is fired
   */
  onScrollEvents(element: FinalRenderElement) {
    if (element.sticky && element.sticky.active) {
      this.setPosition(element);
    }
  }

  /**
   * Main function for the library. Here are some condition calculations and css appending for sticky element when user scroll window
   * @function
   * @param {node} element - Element that will be positioned if it's active
   */
  setPosition(element: FinalRenderElement) {
    this.css(element, { position: "", top: "", left: "" });

    if (this.vp.height < element.sticky.rect.height || !element.sticky.active) {
      return;
    }

    if (!element.sticky.rect.width) {
      element.sticky.rect = this.getRectangle(element);
    }

    if (element.sticky.wrap) {
      this.css(element.parentElement, {
        display: "block",
        width: element.sticky.rect.width + "px",
        height: element.sticky.rect.height + "px",
      });
    }

    console.log(
      element.sticky.rect.top,
      //@ts-ignore
      element.sticky.container === this.body,
      element.sticky.container.isSameNode(this.body)
    );

    if (
      element.sticky.rect.top === 0 &&
      //@ts-ignore
      (element.sticky.container as HTMLBodyElement) === this.body
    ) {
      this.css(element, {
        position: "fixed",
        top: element.sticky.rect.top + "px",
        left: element.sticky.rect.left + "px",
      });

      if (element.sticky.stickyClass) {
        element.classList.add(element.sticky.stickyClass);
      }
    } else if (
      this.scrollTop >
      element.sticky.rect.top - element.sticky.marginTop
    ) {
      console.log("secod");
      this.css(element, {
        position: "fixed",
        left: element.sticky.rect.left + "px",
      });

      if (
        this.scrollTop + element.sticky.rect.height + element.sticky.marginTop >
        element.sticky.containerRect.top +
          element.sticky.container.offsetHeight -
          element.sticky.marginBottom
      ) {
        if (element.sticky.stickyClass) {
          element.classList.remove(element.sticky.stickyClass);
        }

        this.css(element, {
          top:
            element.sticky.containerRect.top +
            element.sticky.container.offsetHeight -
            (this.scrollTop +
              element.sticky.rect.height +
              element.sticky.marginBottom) +
            "px",
        });
      } else {
        if (element.sticky.stickyClass) {
          element.classList.add(element.sticky.stickyClass);
        }

        this.css(element, { top: element.sticky.marginTop + "px" });
      }
    } else {
      if (element.sticky.stickyClass) {
        element.classList.remove(element.sticky.stickyClass);
      }

      this.css(element, { position: "", top: "" });

      if (element.sticky.wrap) {
        this.css(element.parentElement, { display: "", height: "" });
      }
    }
  }

  /**
   * Function that updates element sticky rectangle (with sticky container), then activate or deactivate element, then update position if it's active
   * @function
   */
  update() {
    this.finalElements.forEach((element) => {
      element.sticky.rect = this.getRectangle(element);
      element.sticky.containerRect = this.getRectangle(
        element.sticky.container
      );

      this.activate(element);
      this.setPosition(element);
    });
  }

  /**
   * Destroys sticky element, remove listeners
   * @function
   */
  destroy() {
    window.removeEventListener("load", this.updateScrollTopPosition);
    window.removeEventListener("scroll", this.updateScrollTopPosition);

    this.finalElements.forEach((element) => {
      this.destroyResizeEvents(element);
      this.destroyScrollEvents(element);
    });
  }

  /**
   * Function that returns container element in which sticky element is stuck (if is not specified, then it's stuck to body)
   * @function
   * @param {node} element - Element which sticky container are looked for
   * @return {node} element - Sticky container
   */
  getStickyContainer(
    element: HTMLElement & { sticky: { stickyContainer: string } }
  ) {
    let container = element.parentElement;

    if (container === null || container === undefined) {
      throw new Error(
        "Initial parentElement of element" + element.nodeName + "is null"
      );
    }

    // Search for data-sticky-container if available. go further up the dom.
    while (
      !container!.hasAttribute("data-sticky-container") &&
      !container!.parentElement?.querySelector(
        element.sticky.stickyContainer
      ) &&
      !container?.isSameNode(this.body)
    ) {
      container = container!.parentElement;
    }

    return container;
  }

  /**
   * Function that returns element rectangle & position (width, height, top, left)
   * @function
   * @param {node} element - Element which position & rectangle are returned
   * @return {object}
   */
  getRectangle = <T extends null | HTMLElement>(
    element: T
  ): T extends null ? undefined : Rectangle => {
    if (element === null) {
      //@ts-ignore - TODO: Fix
      return undefined;
    }

    // this.css(element, { position: "", top: "", left: "" });

    const width = Math.max(
      element.offsetWidth,
      element.clientWidth,
      element.scrollWidth
    );
    const height = Math.max(
      element.offsetHeight,
      element.clientHeight,
      element.scrollHeight
    );

    let top = 0;
    let left = 0;

    do {
      top += element.offsetTop || 0;
      left += element.offsetLeft || 0;
      //@ts-ignore
      element = element.offsetParent;
      console.log(element, top);
    } while (element);

    console.log("final", top);

    //@ts-ignore - TS is lacking when narrowing down generics
    return { top, left, width, height };
  };

  /**
   * Function that returns viewport dimensions
   * @function
   * @return {object}
   */
  getViewportSize() {
    return {
      width: Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
      ),
      height: Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0
      ),
    };
  }

  /**
   * Function that updates window scroll position
   * @function
   * @return {number}
   */
  updateScrollTopPosition() {
    this.scrollTop =
      (window.pageYOffset || document.documentElement.scrollTop) -
        (document.documentElement.clientTop || 0) || 0;
  }

  /**
   * Helper function to add/remove css properties for specified element.
   * @helper
   * @param {node} element - DOM element
   * @param {object} properties - CSS properties that will be added/removed from specified element
   */
  css(
    element: HTMLElement | null,
    properties: { [key in keyof Partial<HTMLElement["style"]>]: string }
  ) {
    for (let property in properties) {
      if (element && properties.hasOwnProperty(property)) {
        element.style[property] = properties[property];
      }
    }
  }
}

export default Stickier;
