angular.module('ts.sheets').provider('$media', function(){

  var SHEET_ID = "$$sheetId";

  //TODO:  support automatic interpolation of values between transitions?
  //       and/or support manual interpolation with custom function passing
  var OBSERVER_CONF = {
    attributes: true,
    childList: true
  };

  function _mutationCallback(records, observer){
    angular.forEach(records, function(record){
      //TODO:  this could probably be optimized by
      //       digging into record.type and breaking out
      //       behavior for record.type === "attributes" vs "childList"
      //       but for now, just reapply to entire parent element's subtree
      //TODO:  double-check if record.target (in case of record.type === "attributes") is the parent node or specific child node
      //       If it's the child node, we'll still need to update the parent tree instead of the child, which might require some
      //       passing of the element ID by closure when creating the mutuationCallback
      console.log('mutation observed', record);
      if(record.type === "attributes") console.warn("ensure that record.target is the parent node, not a child node", record)

      _updateElement(record.target);
    });
  }

  var _windowSizeDirty = true;

  function _windowResizeCallback(){
    _windowSizeDirty = true;
    _updateEverything();
  }

  var _cachedResolvedMediaQueries = [];

  //determines all registered media queries that are true, caches results
  function _resolveMediaQueries(){
    if(!_windowSizeDirty) return _cachedResolvedMediaQueries;

    var matched = [];
    angular.forEach(_registeredMediaQueries, function(mediaQuery){
      if(mediaQuery.conditionFn()) matched.push(mediaQuery);
    });

    if(!matched.length) throw new Error('$media assumes at least one media query will be matched (by default this is \'xs\').')

    //sort media queries descendingly by priority
    matched.sort(function(a, b){return b.priority - a.priority});

    _windowSizeDirty = false;
    _cachedResolvedMediaQueries = matched;
    return _cachedResolvedMediaQueries;
  }

  //reevaluate every element (may be expensive)
  function _updateEverything(){
    var elementIds = Object.keys(_elements);
    angular.forEach(elementIds, function(id){
      _updateElement(_elements[id]);
    });
  }

  //naively and greedily test depth by probing first subtree
  function _getObjectDepth(obj, acc){
    var keys = !Array.isArray(obj) && Object.keys(obj);
    if(keys && keys.length) return _getObjectDepth(obj[keys[0]], ++acc);
    return acc;
  }

  //update element and its subtree, applying all relevant sheets
  function _updateElement(element){
    var id = element.data(SHEET_ID);
    var sheets = _elementSheets[id];

    var matchedQueries = _resolveMediaQueries();

    angular.forEach(sheets, function(sheet){

      //support having media queries or omitting them
      //probe depth:  if depth === 3, we have media queries;
      //              if depth === 2, we don't.

      var depth = _getObjectDepth(sheet, 0);
      var matchedLayout;
      if(depth === 2){
        matchedLayout = sheet;
      }else if(depth === 3){
        var found = false;
        //loop through the matched queries by descending priority, finding the first query
        //that exists in obj
        angular.forEach(matchedQueries, function(query){
          if(found) return;
          if(sheet[query.name]){
            found = true;
            matchedLayout = sheet[query.name];

          }
        });
      }else{
        throw new Error('Malformed Sheet.  Object depth of 2 or 3 expected.  Actual depth was ' + depth);
      }

      //nothing to see here
      if(!matchedLayout) return;

      var selectors = Object.keys(matchedLayout);

      angular.forEach(selectors, function(selector){
        var fields = Object.keys(matchedLayout[selector]);
        var elements = element[0].querySelectorAll(selector);

        angular.forEach(elements, function(childElement){
          angular.forEach(fields, function(field){
            var payload = matchedLayout[selector][field];
            _fieldHandlers[field](childElement, payload);
          });
        });

      })

    });
  }

  //cross-browser addEvent from http://stackoverflow.com/questions/641857/javascript-window-resize-event
  var _addEvent = function(elem, type, eventHandle) {
    if (elem == null || typeof(elem) == 'undefined') return;
    if ( elem.addEventListener ) {
      elem.addEventListener( type, eventHandle, false );
    } else if ( elem.attachEvent ) {
      elem.attachEvent( "on" + type, eventHandle );
    } else {
      elem["on"+type]=eventHandle;
    }
  };

  var _registeredMediaQueries = [],
      _sheets = {},
      _elementSheets = {},
      _elements = {},
      _fieldHandlers = {},
      _observers = {};


  var _registerMediaQuery = this.$registerMediaQuery = function(name, conditionFn, priority){
      _registeredMediaQueries[priority] = {name: name, conditionFn: conditionFn, priority: priority};
  };
  var _registerFieldHandler = this.$registerFieldHandler = function(fieldName, handlerFn){
      //TODO:  support passing an array of supported elements
      //       or even a function to determine if a given element is supported
      _fieldHandlers[fieldName] = handlerFn;
  };

  var $media = {
    
    //declare a sheet in a controller/presenter
    $sheet: function(name, spec){
      if(_sheets[name] !== undefined) console.warn('Sheet name \''+name+'\' is already defined.  The latest declaration will overwrite previous declarations.')
      _sheets[name] = spec;
    },

    //apply a sheet by name, called at least by ts-sheet directive
    $applySheet: function(element, name){
      element.data(SHEET_ID, element.data(SHEET_ID) || Math.random()); //TODO:  better uniqueid? 
      var id = element.data(SHEET_ID);
      var spec = _sheets[name];
      if(spec === undefined) throw new Error('Sheet \'' + name + '\' is undefined.  Sheets must be defined using $media.$sheet before they can be applied with ts-sheet.');

      _elements[id] = element;

      _elementSheets[id] = _elementSheets[id] || [];
      _elementSheets[id].push(spec);

      var observer = _observers[id] = _observers[id] || new MutationObserver(_mutationCallback);
      observer.observe(element[0], OBSERVER_CONF);

      //kick off initial action
      _updateElement(element);
    },

    //used for clean-up in ts-sheet directive
    //detaches all sheets from an element and stops an element from being updated
    //does NOT automatically undo whatever logic is declared in payload functions
    $clearSheets: function(element, name) {
      //TODO: test that this works
      var id = element.data(SHEET_ID);

      delete _sheets[name];
      delete _elementSheets[id];
      delete _elements[id]
      _observers[id].disconnect();
    },

    //test whether the mediaQuery of the given name is currently fulfilled
    $query: function(mediaQuery){
      return _registeredMediaQueries[mediaQuery]();
    }
  };

  //expose $media service
  this.$get = function($window){
    //note that this will trigger several times per actual resize in some browsers
    _addEvent($window, "resize", _windowResizeCallback);

    var DEFAULT_MEDIA_QUERIES = [
      {
        name: 'xs',
        conditionFn: function(){
          return true;
        },
        priority: 0
      },
      {
        name: 'sm',
        conditionFn: function(){
          return $window.innerWidth >= 768;
        },
        priority: 1
      },
      {
        name: 'md',
        conditionFn: function(){
          return $window.innerWidth >= 992;
        },
        priority: 2
      },
      {
        name: 'lg',
        conditionFn: function(){
          return $window.innerWidth >= 1200;
        },
        priority: 3
      }
    ];

    //TODO:  support different field names by element type
    //       (e.g. different behavior for 'color' for a div vs a span)
    var DEFAULT_FIELD_HANDLERS = [];

    angular.forEach(DEFAULT_MEDIA_QUERIES, function(mediaQuery){
      _registerMediaQuery(mediaQuery.name, mediaQuery.conditionFn, mediaQuery.priority);
    });

    angular.forEach(DEFAULT_FIELD_HANDLERS, function(fieldHandler){
      _registerFieldHandler(fieldHandler.field, fieldHandler.handlerFn);
    });

    return $media;
  }

});