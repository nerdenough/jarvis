$(function() {

    /**
     * On page load
     */

    /**
     * Check if user is on a small screen
     */
    if ($(document).width() < 600) {
        $('body').addClass('mobile');
    }

    /**
     * Setup page markup
     */
    var input = $('<div id="input"></div>');
    var inputtoggle = $('<div id="input-toggle">[toggle menu]</div>');
    var output = $('<div id="output"></div>');

    $('#container').append(inputtoggle)
                   .append(input)
                   .append(output);

    /**
     * Setup input toggle
     */
    inputtoggle.click(function() {
        input.toggle();
    });


    /**
     * Setup buttons
     */
    api_call('server menu', function(result) {
        console.log('got menu');

        var res = jarvis_handle_result(result);

        if (!res.success) {
            return;
        }

        for (var i in res.data) {
            var menu = $('<span class="menu action" data-call="'+res.data[i][1]+'">'+res.data[i][0]+'</span>');
            menu.click(function() {
                api_call($(this).data('call'));
            });

            input.append(menu);
        }
    });

    /**
     * Setup manual api entry box
     */
    var textbox = $('<input type="text" class="textbox" value="" />');
    textbox.keydown(function(event) {
        // Get enter
        if (event.keyCode == 13) {
            api_call(textbox.val());
            textbox.val("");
        }
    });

    input.append(textbox);
    textbox.focus();

    api_call('server connect');

});


/**
 * Parse request results and return a consistent
 * Javascript object
 */
function jarvis_handle_result(result) {
    console.log('jarvis_handle_result()');
    var res = {}
    res.success = false;

    result = jQuery.parseJSON(result.responseText);

    if (!result) {
        res.result = 'SERVER FAILURE';
        res.message = 'No failure data available';
    } else {
        if (result['state'] != 1) {
            res.result = 'FAILURE';
        } else {
            res.success = true;
        }

        res.message = result['message'];

        if (result['data'] && result['data'].length) {
            if (result['data'] instanceof Array) {
            } else {
                result['data'] = [result['data']];
            }

            res.data = result['data'];
        }

        if (result['actions']) {
            res.actions = result['actions'];
        }

        if (result['notification']) {
            res.notification = result['notification'];
        }

        if (result['redirected']) {
            res.redirected = result['redirected'];
        }
    }

    return res;
}


/**
 * Display a dialog requesting data
 */
function jarvis_dialog(action, callback, params) {
    console.log('jarvis_dialog()');

    var dialog = $('<div class="dialog"></div>');
    var title = action;

    for (var p in params) {
        var param = params[p];
        var nice = param.replace('%', '').replace('_', ' ');
        var element = $('<div></div>');
        element.append($('<label for="dialog-'+param+'">'+nice+'</label>'));
        element.append($('<input type="text" id="dialog-'+param+'" name="'+param+'" />'));
        dialog.append(element);

        // Remove element from dialog title
        title = title.replace(param, '');
    }

    dialog.prepend($('<h2>'+title+'</h2>'));

    dialog.append('<button>Submit</button>');

    $('button', dialog).click(function() {
        for (var p in params) {
            var param = params[p];
            action = action.replace(param, $('input[name="'+param+'"]', dialog).val());
        }

        $.modal.close();
        api_call(action, callback);
    });

    dialog.modal();
}


/**
 * Update title bar
 */
function jarvis_update_title(title) {
    var header = $('div.response h3')
    var refresh = $('<a class="refresh action title" title="Refresh">'+title+'</a>');
    refresh.click(function() {
        api_call(title);
    });

    $('a.title', header).remove();
    header.prepend(refresh);
}


/**
 * Make an API call
 */
var api_call = function(action, callback) {
    console.log('api_call('+action+')');

    // Replace the first two spaces
    url = action.replace(' ', '/').replace(' ', '/');

    /**
     * Check if this a dynamic call, e.g. needs input (look for a %xxx)
     */
    var dynamic = /\%[A-Za-z0-9_]+/g;
    var dvars = url.match(dynamic);
    if (dvars) {
        jarvis_dialog(action, callback, dvars);
        return false;
    }

    /**
     * Prepare HTML
     */
    var baseurl = $('body').data('baseurl');

    var exists = $('div.response');
    if (exists.length) {
        exists.remove();
    }

    var output = $('#output');
    var input = $('#input');
    var render = $('<div class="response">');
    render.data('call', url);
    render.addClass('loading');

    var header = $('<h3>');
    render.append(header);
    output.append(render);

    jarvis_update_title(action);

    var title = action;

    // If no callback function defined, then display normally
    if (callback === undefined) {
        var callback = function(result) {
            console.log('default callback');
            input.val('');

            var res = jarvis_handle_result(result);

            res.url = url;
            if (res.redirected) {
                res.action = res.redirected;
            } else {
                res.action = title;
            }

            var list = $('<ol>');
            for (line in res.data) {
                var item = res.data[line][0];
                var li = $('<li>');

                // Make links clickable
                var html = item.replace(/(https?:\/\/[^ ]+)/g, "<a href=\"$1\" target=\"_blank\">$1</a>");

                li.html(html);

                if (res.data[line].length > 1) {
                    var action = res.data[line][1];
                    if (action) {
                        li.addClass('expands');
                        li.addClass('action');
                        li.data('action', action);
                        li.click(function() {
                            api_call($(this).data('action'));
                        });
                    }
                }

                // List item actions (or options)
                if (res.data[line].length > 2) {
                    var options = res.data[line][2];
                    var metacontainer = false;
                    if (options) {
                        var olist = $('<ol class="options">');
                        olist.hover(undefined, function() {
                            $(this).hide();
                        });

                        var olistcontainer = $('<div class="optioncontainer">');
                        var olisttoggle = $('<span class="optiontoggle">^</span>');
                        olisttoggle.hover(function() {
                            $('ol.options').hide();
                            $('ol.options', $(this).parent()).show();
                        });

                        for (var o in options) {
                            // Check if option is metadata
                            var ismetadata = o.match(/^\[(.*)\]$/);

                            if (ismetadata) {
                                var option = $('<span class="action">');
                                option.html(o.substr(1, o.length - 2));
                            } else {
                                var option = $('<li class="action">');
                                option.html(o);
                            }

                            option.attr('title', options[o]);
                            option.data('action', options[o]);
                            option.click(function() {
                                api_call($(this).data('action'));
                            });

                            option.hover(
                                function() {
                                    $(this).parent().closest('li').addClass('hoveraction');
                                },
                                function() {
                                    $(this).parent().closest('li').removeClass('hoveraction');
                                }
                            );

                            if (ismetadata) {
                                option.addClass('metadata');

                                if (!metacontainer) {
                                    var metacontainer = $('<div>').addClass('metadata');
                                    li.append(metacontainer);
                                }

                                metacontainer.append(option);
                            } else {
                                olist.append(option);
                            }
                        }

                        olistcontainer.prepend(olist);
                        olistcontainer.prepend(olisttoggle);
                        li.prepend(olistcontainer);
                    }
                }

                list.append(li);
            }

            // Page actions
            if (res.actions) {
                for (var action in res.actions) {
                    var span = $('<span>'+res.actions[action][0]+'</span>');
                    span.addClass('action');
                    span.data('action', res.actions[action][1]);
                    span.click(function() {
                        api_call($(this).data('action'));
                    });

                    header.append(span);
                }
            }

            console.log('update output');
            render.removeClass('loading');

            if (res.result) {
                render.append($('<div class="result">').html(res.result));
                render.addClass('error');
            }

            if (res.notification) {
                var notification = $('<div class="notification">').html(res.notification);
                notification.on('click', function() {
                    $('#output .response').removeClass('notice');
                    $(this).remove();
                });
                render.append(notification);
                render.addClass('notice');
            }

            var message = $('<div class="message">').html(res.message);

            render.append(message);
            render.append(list);

            jarvis_update_title(res.action);
        }
    }

    console.log('json call to "'+url+'"');
    $.ajax({
        dataType: "json",
        url: baseurl+escape(url),
        data: '',
        complete: callback,
        headers: {'secret': $('body').data('secret')}
    });
}
