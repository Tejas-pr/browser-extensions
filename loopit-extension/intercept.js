(function () {
  'use strict';

  // Hook into document.createElement
  const originalCreateElement = document.createElement;
  document.createElement = function (tagName) {
    const el = originalCreateElement.apply(this, arguments);
    if (tagName && (tagName.toLowerCase() === 'audio' || tagName.toLowerCase() === 'video')) {
      // Expose the element to the DOM if it isn't already
      setTimeout(() => {
        if (document.body && !document.body.contains(el)) {
          let container = document.getElementById('loopit-hidden-media-container');
          if (!container) {
            container = originalCreateElement.call(document, 'div');
            container.id = 'loopit-hidden-media-container';
            container.style.display = 'none';
            document.body.appendChild(container);
          }
          container.appendChild(el);
        }
      }, 3000); // Give the site time to load and potentially append it itself
    }
    return el;
  };
})();
