/**
 * plugin.js
 *
 * Copyright, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */


tinymce.PluginManager.add('image', function (editor) {
    function showDialog() {
        var win;

        function startUploadImage() {
            $fileuploadContainer.trigger('startUpload');
        }

        // Simple default dialog
        win = editor.windowManager.open({
            title: 'Insert image',
            name: 'cb-image-upload',
            buttons: [
                {text: 'Ok', subtype: 'primary', onclick: function () {
                    startUploadImage();
                }},
                {text: 'Cancel', onclick: function () {
                    win.close();
                }}
            ],
            width: 400,
            height: 200
        });

        win.addClass('cb-picture-uploader-container');

        var $fileuploadContainer = $('#' + win._id + '-body');
        $fileuploadContainer.append('<div class="cb-picture-uploader">' +
            '<form>' +
            '<div class="files">' +
            '<div class="fileupload-preview">' +
            '</div>' +
            '</div>' +
            '<div class="fileupload-uploadzone">' +
            '<div class="fileupload-uploadhint">Click or drag an image here</div>' +
            '</div>' +
            '<input type="file" class="hidden" name="file" />' +
            '</form>' +
            '<div class="progress progress-striped active" style="display:none"><div class="bar"></div></div>' +
            '</div>');

        // Unhide the input type file if on IE <= 9
        if ($.browser.msie && $.browser.version <= 9) {
            $fileuploadContainer.find("input[type=file]").removeClass("hidden");
        }

        $fileuploadContainer.fileupload({
            dataType: 'json',
            url: editor.settings.uploadimage_form_url,
            previewMaxHeight: 100,
            formData: {
                authenticity_token: $('meta[name="csrf-token"]').attr('content')
            },
            previewMaxWidth: 300,
            type: 'POST',
            replaceFileInput: false,
            dropZone: $fileuploadContainer.find('fileupload-uploadzone'),
            add: function (e, data) {
                $fileuploadContainer.unbind("startUpload");

                var that = $(this).data('blueimp-fileupload') ||
                        $(this).data('fileupload'),
                    options = that.options,
                    files = data.files;
                $(this).fileupload('process', data).done(function () {
                    that._adjustMaxNumberOfFiles(-files.length);
                    data.maxNumberOfFilesAdjusted = true;
                    data.files.valid = data.isValidated = that._validate(files);

                    if (!($.browser.msie && $.browser.version <= 9)) {
                        $fileuploadContainer.find(".files").empty();
                    }

                    data.context = that._renderUpload(files).data('data', data);
                    options.filesContainer[
                        options.prependFiles ? 'prepend' : 'append'
                        ](data.context);
                    that._renderPreviews(data);
                    that._forceReflow(data.context);
                    that._transition(data.context).done(
                        function () {
                            if ((that._trigger('added', e, data) !== false) &&
                                (options.autoUpload || data.autoUpload) &&
                                data.autoUpload !== false && data.isValidated) {
                                data.submit();
                            }
                        }
                    );

                    $fileuploadContainer.bind("startUpload", function () {
                        data.submit();
                    })
                });
            },
            uploadTemplate: function (o) {
                return $('<div class="fileupload-preview"><div class="preview"><span></span></div></div>');
            },
            send: function (e, data) {
                $fileuploadContainer.find('.progress').fadeIn();
            },
            progress: function (e, data) {
                // This is what makes everything really cool, thanks to that callback
                // you can now update the progress bar based on the upload progress
                var percent = Math.round((e.loaded / e.total) * 100)
                $fileuploadContainer.find('.bar').css('width', percent + '%')
            },
            done: function (e, data) {
                console.log(data.result);
                if (data.result.image) {
                    var imgSettings = {
                        src: data.result.image.url,
                        width: data.result.image.width,
                        height: data.result.image.height
                    };

                    editor.insertContent(editor.dom.createHTML('img', imgSettings));
                    win.close();
                }
                else {
                    console.log('error');
                }
            },
            fail: function (e, data) {
                console.log('fail');
            }
        });

        if (!($.browser.msie && $.browser.version <= 9)) {
            $fileuploadContainer.find(".fileupload-uploadzone").click(function (e) {
                $fileuploadContainer.find(":file").click();
                e.preventDefault();
                return false;
            });
        }
    }

    editor.addButton('image', {
        icon: 'image',
        tooltip: 'Insert/edit image',
        onclick: showDialog,
        stateSelector: 'img:not([data-mce-object])'
    });

    editor.addMenuItem('image', {
        icon: 'image',
        text: 'Insert image',
        onclick: showDialog,
        context: 'insert',
        prependToContext: true
    });
});