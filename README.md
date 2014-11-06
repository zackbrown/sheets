## Sheets

Handle your presentation logic like CSS, but with Javascript.

Just the right blend of declarative (HTML selectors), imperative (Turing-complete animation logic,) and functional-reactive (just return values from functions and Sheets will handle bindings and updates.)

Supports responsive layouts out of the box with the canonical Bootstrap breakpoints: 'xs', 'sm', 'md', and 'lg'.  Don't want to use those?  Register your own breakpoints!

### Defining a sheet

Use the $media service to define a sheet:

```
$media.$sheet('State1Sheet', {

    xs: {
      '#left-column': {
        transform: function() {
          var translate = $timeline([
            [0, [10, 150, 0]],
          ])(t.get());
          return Transform.translate.apply(this, translate);
        }
      }
    },
    
    sm: {
      '#left-column': {
        transform: function() {
          var translate = $timeline([
            [0, [220, 190, 0]],
          ])(t.get());
          return Transform.translate.apply(this, translate);
        },
      }
    }
    
  });
```

### Using a sheet

Use the ts-sheet directive on the top level element of the html tree you want your sheet applied to:

```
<fa-view ts-sheet="State1Sheet"></fa-view>
```

### Defining handlers

Each attribute on a sheet needs a handler to define how it affects the DOM. You define handlers in a configure block by calling registerFieldHanlder on $mediaProvider. Sheets does not define any handlers on its own, to allow maximum customization. If you are using Sheets with Famo.us Angular, here is some bootstrap code that will setup Famo.us Angular like attributes:

```
.config(function($mediaProvider, $famousProvider) {
  var $famous = $famousProvider.$get();
  var Timer = $famous['famous/utilities/Timer'];

  var FAMOUS_FIELD_HANDLERS = [
      {
        field: 'transform',
        handlerFn: function(element, payloadFn){
          var isolate = $famous.getIsolate(angular.element(element).scope());
          isolate.modifier.transformFrom(payloadFn);
        }
      },
      {
        field: 'size',
        handlerFn: function(element, payloadFn){
          var isolate = $famous.getIsolate(angular.element(element).scope());
          isolate.modifier.sizeFrom(payloadFn);
        }
      },
      {
        field: 'origin',
        handlerFn: function(element, payloadFn){
          var isolate = $famous.getIsolate(angular.element(element).scope());
          isolate.modifier.originFrom(payloadFn);
        }
      },
      {
        field: 'align',
        handlerFn: function(element, payloadFn){
          var isolate = $famous.getIsolate(angular.element(element).scope());
          isolate.modifier.alignFrom(payloadFn);
        }
      },
      {
        field: 'opacity',
        handlerFn: function(element, payloadFn){
          var isolate = $famous.getIsolate(angular.element(element).scope());
          isolate.modifier.opacityFrom(payloadFn);
        }
      },
      {
        field: 'options',
        handlerFn: function(element, payloadFn){
          //TODO:  support
          throw new Error('unimplemented: cannot yet set options through Sheets')
          //we need to angular $watch this one, since
          //options doesn't support functional assignment
          //Need to make sure to clean up watchers when this gets re-called
        }
      },
  ];

  angular.forEach(FAMOUS_FIELD_HANDLERS, function(fieldHandler) {
    $mediaProvider.$registerFieldHandler(fieldHandler.field, fieldHandler.handlerFn);
  });

})
```