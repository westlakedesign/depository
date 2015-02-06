# depository.js
Universal HTML5 drag and drop "dropzone" creating plugin written in vanilla javascript

### Usage
Depository can be used three different ways which can be mixed and matched
#### Settings object in constructor
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

#### Dot-notation
``` javascript
uploader.onEnter = function () {
  /* Do something when you enter the element */
};
uploader.onLeave = function () {
  /* Do something when you leave the element; also occurs on drop */
};
```

#### Using HTML attributes (html/erb)
``` erb
<div id="dropzone" data-dnd-url="<%= update_api_client_url(@client, :json) %>"></div>
```

### Settings
#### Options
* **url** - *(String)* The url the uploader will push to
* **method** - *(String)* The http method to use (GET, POST, PUT, PATCH, etc)
* **fieldName** - *(String)* The form field name to send the upload with (i.e. 'image' or 'client[avatar]')
* **multi** - *(Boolean)* Whether or not the uploader should support multi-drop uploading
* **accept** - *(String Array)* Array of accepted file types (i.e. 'image/jpeg') to allow to be dropped
* **dataType** - *(String)* Supports "text" or "json" response types, use text for html as well
* **csrfParam** - *(String)* The cross site request forgery parameter used by ruby on rails
* **csrfToken** - *(String)* The cross site request forgery token used by ruby on rails

#### DOM Event Listener Functions
* **onBodyEnter** - Triggers when you drag onto the page
* **onBodyLeave** - Triggers when you drag off the page, also triggers on drop
* **onEnter** - Triggers when you drag over the dropzone element
* **onLeave** - Triggers when you drag away from the dropzone element, also triggers on drop

#### Uploader Event Functions
<dl>
  <dt>onEnqueue( <i>file</i> )</dt>
  <dd>Triggers each time a file is queued</dd>
  
  <dt>onStart( <i>queue</i> )</dt>
  <dd>Triggers when the uploading process starts (after queing of dropped files)</dd>

  <dt>onProgress( <i>xhrEvent</i>, <i>file</i> )</dt>
  <dd>Triggers when a progress event is emitted from the XHR event</dd>

  <dt>onAbort( <i>xhrEvent</i>, <i>file</i> )</dt>
  <dd>Triggers if a file's XHR event is aborted by the user</dd>

  <dt>onSuccess( <i>response</i>, <i>httpReponseCode</i>, <i>file</i> )</dt>
  <dd>Triggers on each file's successful upload (4xx response code)</dd>

  <dt>onError( <i>response</i>, <i>httpReponseCode</i>, <i>file</i> )</dt>
  <dd>Triggers if upload fails to start or if upload receives a failing response code (non 4xx)</dd>

  <dt>afterUpload()</dt>
  <dd>Triggers after entire queue has been processed</dd>
</dl>
