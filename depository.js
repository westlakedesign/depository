/*jslint browser: true*/
(function () {
    'use strict';

    window.depository = function (element, options) {
        /**
         * Settings
         */

        // Declarations
        var elem, spec, func, publ, util, queue, uploads, uploading, internalId;

        // Initializations
        elem = {};                  // elements object
        spec = {};                  // settings object (exposed to allow setting via dot-notation)
        func = {};                  // plugin functions
        publ = {};                  // exposed public functions
        util = {};                  // utility functions
        queue = [];                 // file queue
        uploads = [];               // active uploads
        uploading = false;          // uploading flag
        internalId = 0;             // file identifier

        // Intitialize default settings (these are all overidable through data attributes, the setup object, and dot-notation)
        spec.url = document.URL;
        spec.method = 'POST';
        spec.fieldName = 'image';
        spec.multi = true;
        spec.accept = [
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        spec.dataType = 'Text';
        spec.csrfParam = undefined;
        spec.csrfToken = undefined;
        spec.onBodyEnter = function () { return undefined; };
        spec.onBodyLeave = function () { return undefined; };
        spec.onEnter = function () { return undefined; };
        spec.onLeave = function () { return undefined; };
        spec.onStart = function () { return undefined; };
        spec.onEnqueue = function () { return undefined; };
        spec.onProgress = function () { return undefined; };
        spec.onSuccess = function () { return undefined; };
        spec.onAbort = function () { return undefined; };
        spec.onError = function () { return undefined; };
        spec.afterUpload = function () { return undefined; };

        // Add csrf info if the meta fields exist (rails support)
        if (document.getElementsByName('csrf-param').length && document.getElementsByName('csrf-token').length) {
            spec.csrfParam = document.getElementsByName('csrf-param')[0].content;
            spec.csrfToken = document.getElementsByName('csrf-token')[0].content;
        }


        /**
         * Methods
         */

        func.init = function (element, options) {
            var dataOpts;

            // Stop plugin if not HTML5
            if (!util.isHTML5()) {
                return;
            }

            elem.body = document.getElementsByTagName('body')[0];
            elem.dropzone = func.processElement(element);

            // Stop if element is undefined
            if (elem.dropzone === undefined) {
                console.log(element);
                console.warn('invalid element passed to depository');
                return;
            }

            dataOpts = func.getDataOptions(elem.dropzone);

            func.processOptions(dataOpts);
            func.processOptions(options);
            func.addHandlers();
        };

        // attempt to get vanilla js element
        func.processElement = function (element) {
            var el;

            if (element.length === undefined) {
                el = element;
            } else {
                el = element[0];
            }

            return el;
        };

        // create options from data attributes
        func.getDataOptions = function (element) {
            var data;

            data = {};

            [].forEach.call(element.attributes, function (attr) {
                var name, value;

                if (/^data-dnd-/.test(attr.name)) {
                    name = util.camelCase(attr.name.replace(/^data-dnd-/, ''));
                    value = attr.value;

                    // Allows you to use data attributes to assign global functions to handlers
                    if ((/^on/).test(name)) {
                        if (typeof window[value] === 'function') {
                            data[name] = window[value];
                        }
                    } else {
                        data[name] = value;
                    }
                }
            });

            return data;
        };

        // allowed options to spec
        func.processOptions = function (options) {
            var allowedOptions;

            if (options === undefined) {
                return;
            }

            allowedOptions = Object.keys(spec);

            Object.keys(options).forEach(function (key) {
                if (allowedOptions.indexOf(key) !== -1) {
                    spec[key] = options[key];
                }
            });
        };

        // add all element event listeners
        func.addHandlers = function () {
            var overTimeout;

            elem.dropzone.addEventListener('dragenter', function (e) {
                util.stop(e);
                spec.onEnter(e);
            });
            elem.dropzone.addEventListener('dragleave', function (e) {
                util.stop(e);
                spec.onLeave(e);
            });
            elem.dropzone.addEventListener('drop', function (e) {
                util.stop(e);
                spec.onLeave(e);

                // trigger body leave and clear the timeout
                spec.onBodyLeave(e);
                clearTimeout(overTimeout);
                overTimeout = undefined;

                // handle files!
                func.handleFileDrop(e);
            });

            // Enabled the plus sign cursor over the dropzone
            elem.dropzone.addEventListener('dragover', function (e) {
                e.dataTransfer.dropEffect = "copy";
            });

            // Allow "drop here" like functionality
            document.addEventListener('dragover', function (e) {
                util.stop(e);

                if (overTimeout === undefined) {
                    spec.onBodyEnter(e);
                }

                clearTimeout(overTimeout);

                overTimeout = setTimeout(function () {
                    spec.onBodyLeave(e);
                    overTimeout = undefined;
                }, 100);
            });

            // Prevent unintended body drops
            document.addEventListener('drop', util.stop);
        };

        // Take dropped file and add them to the queue, start upload if not uploading 
        func.handleFileDrop = function (e) {
            func.processFiles(e.dataTransfer.files);
        };

        // Send either one or multiple files to addToQueue
        func.processFiles = function (files) {
            var i;

            if (spec.multi === false) {
                func.addToQueue(files[0]);
            } else {
                for (i = 0; i < files.length; i += 1) {
                    func.addToQueue(files[i]);
                }
            }
        };

        // Test file type and push to the queue
        func.addToQueue = function (file) {
            if (spec.accept.indexOf(file.type) === -1) {
                return;
            }

            internalId += 1;
            file.id = internalId;
            spec.onEnqueue(file);
            queue.push(file);

            func.startUpload();
        };

        // Toggle the upload flag and start the first upload
        func.startUpload = function () {
            if (uploading || queue.length === 0) {
                return;
            }

            uploading = true;
            spec.onStart(queue);
            func.uploadAFile();
        };

        // Recursively upload files one by one
        func.uploadAFile = function () {
            var file, fd, xhr;

            // Shift off the top of the queue (to handle in first come first serve)
            file = queue.shift();

            fd = new FormData();
            fd.append(spec.fieldName, file);

            // if both csrf options exist add them to the form
            if (typeof spec.csrfParam === 'string' && typeof spec.csrfToken === 'string') {
                fd.append(spec.csrfParam, spec.csrfToken);
            }

            xhr = new XMLHttpRequest();

            // Add all the XHR listeners
            xhr.upload.addEventListener('progress', function (e) { spec.onProgress(e, file); }, false);
            xhr.addEventListener('abort', function (e) { spec.onAbort(e, file); }, false);
            xhr.addEventListener('error', function () {
                var res;

                res = xhr.responseText;

                if (spec.dataType === 'JSON') {
                    try {
                        res = JSON.parse(res);
                    } catch (e) {
                        res = '';
                    }
                }

                spec.onError(res, 0, file);
            });
            xhr.addEventListener('load', function () {
                var res, code;

                code = xhr.status;
                res = xhr.responseText;

                if (spec.dataType === 'JSON') {
                    try {
                        res = JSON.parse(res);
                    } catch (e) {
                        res = '';
                    }
                }

                if (/2\d{2}/.test(code.toString())) {
                    spec.onSuccess(res, code, file);
                } else {
                    spec.onError(res, code, file);
                }

                func.next();
            }, false);

            xhr.addEventListener('loadend', function () {
                uploads.splice(xhr, 1);
            }, false);

            // start upload
            uploads.push(xhr);
            xhr.open(spec.method, spec.url);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            if (spec.dataType === 'JSON') {
                xhr.setRequestHeader('Accept', 'application/json');
            }
            xhr.send(fd);
        };

        // Check if upload is finished and set flag or trigger next upload
        func.next = function () {
            if (queue.length === 0) {
                uploading = false;
                spec.afterUpload();
                return;
            }

            func.uploadAFile();
        };

        // Abort all active uploads
        func.abort = function () {
            queue = [];
            uploads.forEach(function (val) {
                val.abort();
                uploads.splice(val, 1);
            });
        };


        /**
         * public functions
         */

        // Exposed functions
        publ.addToQueue = func.addToQueue;
        publ.abort = func.abort;

        // Setters
        publ.url = function (url) {
            if (typeof url === 'string') {
                spec.url = url;
            }
        };

        publ.method = function (method) {
            if (typeof method === 'string') {
                spec.method = method;
            }
        };

        publ.fieldName = function (fieldName) {
            if (typeof fieldName === 'string') {
                publ.fieldName = fieldName;
            }
        };

        publ.multi = function (multi) {
            if (typeof multi === 'boolean' || typeof multi === 'number') {
                spec.multi = multi;
            }
        };

        publ.accept = function (accept) {
            if (typeof accept === 'object' && accept.length !== undefined) {
                spec.accept = accept;
            }
        };

        publ.dataType = function (dataType) {
            if (typeof dataType === 'string') {
                spec.dataType = dataType;
            }
        };

        publ.csrfParam = function (csrfParam) {
            if (typeof csrfParam === 'string') {
                spec.csrfParam = csrfParam;
            }
        };

        publ.csrfToken = function (csrfToken) {
            if (typeof csrfToken === 'string') {
                spec.csrfToken = csrfToken;
            }
        };

        publ.onBodyEnter = function (onBodyEnter) {
            if (typeof onBodyEnter === 'function') {
                spec.onBodyEnter = onBodyEnter;
            }
        };

        publ.onBodyLeave = function (onBodyLeave) {
            if (typeof onBodyLeave === 'function') {
                spec.onBodyLeave = onBodyLeave;
            }
        };

        publ.onEnter = function (onEnter) {
            if (typeof onEnter === 'function') {
                spec.onEnter = onEnter;
            }
        };

        publ.onLeave = function (onLeave) {
            if (typeof onLeave === 'function') {
                spec.onLeave = onLeave;
            }
        };

        publ.onStart = function (onStart) {
            if (typeof onStart === 'function') {
                spec.onStart = onStart;
            }
        };

        publ.onEnqueue = function (onEnqueue) {
            if (typeof onEnqueue === 'function') {
                spec.onEnqueue = onEnqueue;
            }
        };

        publ.onProgress = function (onProgress) {
            if (typeof onProgress === 'function') {
                spec.onProgress = onProgress;
            }
        };

        publ.onSuccess = function (onSuccess) {
            if (typeof onSuccess === 'function') {
                spec.onSuccess = onSuccess;
            }
        };

        publ.onAbort = function (onAbort) {
            if (typeof onAbort === 'function') {
                spec.onAbort = onAbort;
            }
        };

        publ.onError = function (onError) {
            if (typeof onError === 'function') {
                spec.onError = onError;
            }
        };

        publ.afterUpload = function (afterUpload) {
            if (typeof afterUpload === 'function') {
                spec.afterUpload = afterUpload;
            }
        };


        /**
         * utility functions
         */

        util.isHTML5 = function () {
            return (typeof FormData === "function" || typeof FormData === "object") &&
                (typeof XMLHttpRequest === "function" || typeof XMLHttpRequest === "object");
        };

        util.stop = function (e) {
            e.preventDefault();
            e.stopPropagation();
        };

        util.camelCase = function (word) {
            /*jslint unparam: true*/
            word =  word.replace(/-([\w\W])/g, function (w1, w2) {
                return w2.toUpperCase();
            });
            /*jslint unparam: false*/

            return word;
        };


        /**
         * Initialize
         */

        func.init(element, options);

        return publ;
    };
}());