# depository.js
Universal HTML5 drag and drop "dropzone" creating plugin written in vanilla javascript

### Settings object in constructor
``` javascript
var uploader = dndUpload($('#dropzone'), {
  onSave: function (result) {
    /* Do something after upload, using result */
  },
  onBodyEnter: function () {
    /* Do something when you enter the page */
  },
  onBodyLeave: function () {
    /* Do something when you leave the page; also occurs on drop */
  }
});
```

### Using dot-notation
``` javascript
uploader.onEnter = function () {
  /* Do something when you enter the element */
};
uploader.onLeave = function () {
  /* Do something when you leave the element; also occurs on drop */
};
```

### Using HTML attributes (html/erb)
``` erb
<div id="dropzone" data-dnd-url="<%= update_api_client_url(@client, :json) %>"></div>
```
