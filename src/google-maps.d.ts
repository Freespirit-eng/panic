declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: any);
      [key: string]: any;
    }
    class Marker {
      constructor(options?: any);
      [key: string]: any;
    }
    class Circle {
      constructor(options?: any);
      [key: string]: any;
    }
    class LatLng {
      constructor(lat: number, lng: number);
      [key: string]: any;
    }
    type MapTypeStyle = any;
    type MapMouseEvent = any;
    type IconSequence = any;
    const ControlPosition: any;
    const SymbolPath: any;
    const Animation: any;
  }
}
