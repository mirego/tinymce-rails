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


tinymce.PluginManager.add('cbimage20190403103500', function (editor) {
    function showDialog(ui, value) {
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
            '<div class="fileupload-uploadhint">' + editor.editorManager.translate('Click or drag an image here') + '</div>' +
            '</div>' +
            '<input type="file" class="hidden" name="file" />' +
            '</form>' +
            '<div class="fileupload-changefile" style="display:none">' + editor.editorManager.translate('Change') + '</div>' +
            '<div class="progress progress-striped active" style="display:none"><div class="bar"></div></div>' +
            '<div class="fileupload-error" style="display:none"></div>' +
            '</div>');

        $fileuploadContainer.fileupload({
            dataType: 'json',
            url: editor.settings.uploadimage_form_url,
            formData: {
                authenticity_token: $.cookie('XSRF-TOKEN')
            },
            previewMaxHeight: 140,
            previewMaxWidth: 350,
            previewThumbnail: false,
            type: 'POST',
            replaceFileInput: false,
            dropZone: $fileuploadContainer.find('.fileupload-uploadzone'),
            add: function (e, data) {
                $fileuploadContainer.find(".fileupload-uploadzone").hide();
                $fileuploadContainer.find('.fileupload-changefile').show();

                $fileuploadContainer.unbind("startUpload");

                var that = $(this).data('blueimp-fileupload') ||
                        $(this).data('fileupload'),
                    options = that.options,
                    files = data.files;
                $(this).fileupload('process', data).done(function () {
                    $fileuploadContainer.find(".files").empty();

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
                        $fileuploadContainer.find('.fileupload-changefile').hide();
                        data.submit();
                    });
                });
                $fileuploadContainer = $(this);
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
                var percent = Math.round((data.loaded / data.total) * 100)
                $fileuploadContainer.find('.bar').css('width', percent + '%')
            },
            done: function (e, data) {
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
                    $fileuploadContainer.find('.fileupload-error').text(data.result.error.message).show();
                    $fileuploadContainer.find('.fileupload-preview, .fileupload-changefile, .progress').hide();
                    $fileuploadContainer.find('.bar').css('width', 0);
                    $fileuploadContainer.find('.fileupload-uploadzone').show();
                }
            },
            fail: function (e, data) {
                $fileuploadContainer.find('.fileupload-error').text(editor.editorManager.translate('An error occurred while uploading the image.')).show();
                $fileuploadContainer.find('.fileupload-preview, .fileupload-changefile, .progress').hide();
                $fileuploadContainer.find('.bar').css('width', 0);
                $fileuploadContainer.find('.fileupload-uploadzone').show();
            },
            previewdone: function(e, data) {
                var $preview = $fileuploadContainer.find(".preview");
                var height = $preview.height();
                var width = $preview.width();

                $preview.css({marginTop: (90 - height/2) + 'px', marginLeft: (200 - width/2) + 'px'});
            }
        });

        $fileuploadContainer.find(".fileupload-uploadzone, .fileupload-changefile").click(function (e) {
            $fileuploadContainer.find('.fileupload-error').hide();
            $fileuploadContainer.find(":file").click();
            e.preventDefault();
            return false;
        });

        if (value && value.files && value.files.length > 0) {
            $fileuploadContainer.fileupload('add', {files: value.files});
        }
    }

    editor.addButton('image', {
        icon: 'image',
        tooltip: 'Insert image',
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

    editor.addCommand('DropImage', showDialog);
});
