/***********************************************************
 ****   ©2013 kwarkee.com
 ************************************************************/


"use strict";
var _kwarkee = (function(){

    var template_filetype = 'html';

    var URL_PARAM_FIND = 'find';
    var URL_PARAM_CAMPAIGN_TYPE = 'searchtype';

    $(function(){

        //automaticly adjust linking to template filetype
        $('a').each(function(index){
            var link = $(this);
            var link_href = link.attr('href');

            //apply propper link
            if(link_href.match(/^#!/i)){
                link_href = link_href.replace(/^#!/i,'');
                var link_parts = link_href.split('?');
                var new_link = link_parts[0] + '.' + template_filetype;
                if(link_parts.length > 1) new_link += '#'+link_parts[1];

                link.attr('href', new_link );
            }
        });

        //check for URL-params
        var url = window.location.href;
        var url_params = url.replace(/[^#]+#?(?=[^#]*$)/i,'');
        if(url_params.length > 0){
            url_params = decodeURI( url_params );

            url_params = url_params.split('&');
            var params_obj = {};

            for(var i=0; i < url_params.length; i++){
                var key_value = url_params[i].split('=');
                params_obj[ key_value[0] ] = key_value[1];
            }

            console.log('PARAMS:',params_obj)
        }

        $('#kwarkee_search').submit(onUserQuickSearch);
        $('#kwarkee_login').submit(onUserLogin);
        //$('#kwarkee_logout').click();
        //$('#kwarkee_userprofile').submit();
    });

    //--------- PUBLIC ---------
    //-- attributes get/set

    //-- methods


    //--------- PRIVATE ---------

    function sendApiRequest(url, data, callback, send_as_get ){
        var send_as_post = (!send_as_get);
        var url = './api/'+url;

        alert('sending request to: '+url)
        if(send_as_post) $.post(url, data, callback);
    }

    function extractFormData( form )
    {
        var all_form_data = $(form).serializeArray();
        var data_obj = {};

        for(var i=0; i < all_form_data.length; i++){
            data_obj[ all_form_data[i].name ] = all_form_data[i].value;
        }

        return data_obj;
    }

    //-------- LISTENER ---------

    function onUserQuickSearch(evt)
    {
        evt.preventDefault();
        window.location.href = 'browse-4a.'+template_filetype+'#'+URL_PARAM_FIND+'='+encodeURI( $(evt.target).find('input').val() );
    }

    function onUserLogin(evt){
        evt.preventDefault();

        sendApiRequest('user/signin', extractFormData(evt.target), onUserLoginResponse);
    }

    function onUserLoginResponse(data){
        console.log('login-response: ',data);
    }

})();