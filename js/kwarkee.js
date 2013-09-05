/***********************************************************
 ****   ©2013 kwarkee.com
 ************************************************************/


"use strict";
var _kwarkee = (function(){

    var url_params;

    var TEMPLATE_FILETYPE = 'html';

    var API_BASE = './api/';
    var API_URLS = {
        'signup': 'member/',
        'signin': 'member/signin',
        'update_profile': 'member/',
        'logout': '',
        'search':'',
        'get_campaign_details': 'campaign/details',
        'get_feat_campaigns': ''
    };

    var URL_PARAM_FIND = 'search_query';
    var URL_PARAM_CAMPAIGN_ID = 'cpid';
    var SEARCH_PAGE_URL = './browse-4a';

    $(function(){

        //automaticly adjust linking to template filetype
        $('a').each(function(index){
            var link = $(this);
            var link_href = link.attr('href');

            //apply propper link
            if(link_href.match(/^#!/i)){
                link_href = link_href.replace(/^#!/i,'');
                var link_parts = link_href.split('?');
                var new_link = link_parts[0] + '.' + TEMPLATE_FILETYPE;
                if(link_parts.length > 1) new_link += '#'+link_parts[1];

                link.attr('href', new_link );
            }
        });

        //check for URL-params
        var url = window.location.href;
        url_params = url.replace(/[^#]+#?(?=[^#]*$)/i,'');
        var params_obj = {};

        if(url_params.length > 0){
            url_params = decodeURI( url_params );

            url_params = url_params.split('&');

            for(var i=0; i < url_params.length; i++){
                var key_value = url_params[i].split('=');
                params_obj[ key_value[0] ] = key_value[1];
            }

            console.log('PARAMS:',params_obj)
        }

        //general listeners
        
        $('#kwarkee_login').submit(onUserLogin);
        $('#kwarkee_logout').click(onUserLogout);

        //if page has the browse-filters box
        var search_filters = $('#browse_filters');
        if(search_filters.length == 1){

            var is_search_detail_view = ($('#campaign_details').length == 1);

            applySearchState( params_obj, search_filters, is_search_detail_view );

            search_filters.find('form').submit(onTriggerDetailSearch);
            $('#kwarkee_search').submit(onTriggerDetailSearch);

        }else{
            //quicksearches from top menu
            $('#kwarkee_search').submit(onUserQuickSearch);
        }

        //registration page
        var registration_form = $('#registration_form');
        if(registration_form.length == 1){
            $('#b-individual-plan').click(onSelectAccountType);
            $('#b-firm-plan').click(onSelectAccountType);
            registration_form.submit(onSubmitRegistration);
        }

        //userprofile page
        var userprofile_form = $('#kwarkee_userprofile');
        if(userprofile_form.length == 1){
            userprofile_form.submit(onEditUserProfile);
        }

        $('#helplink').click(function(){alert("'Help' will be available soon. Meanwhile you can contact us via info@kwarkee.com")});
        $('.header-padd img').attr('title', 'return to kwarkee landing page');
    });

    //--------- PUBLIC ---------
    //-- attributes get/set

    //-- methods


    //--------- PRIVATE ---------

    function sendApiRequest(url, data, callback, send_as_get ){
        var send_as_post = (!send_as_get);
        var url = API_BASE + url;

        alert('sending request to: '+url+'  -  '+JSON.stringify(data));
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

    function extractSearchData( form )
    {
        var filter_data = extractFormData(form);
        filter_data['search_query'] = $('#browse-search-inpt').val();

        return filter_data;
    }
    
    function getSearchLinkParams( url_data_obj, include_detailview_id )
    {
        var params = [];

        $.each(url_data_obj, function(key, value){
            if(!include_detailview_id && key == URL_PARAM_CAMPAIGN_ID) return; //not search-relevant

            params.push(key + '=' + encodeURI(value));
        });

        return '#' + params.join('&');
    }

    function applySearchState( url_params, browse_filters_wrap, is_search_detail_view )
    {
        //apply listener-btn to 'back-to-search'-btn
        if(is_search_detail_view){
            var back_to_search_results_btn = $('#campaign_details #back_to_search_results');

            //only show back-button if search params are present (resp. user must have came from the search)
            if(url_params.search_type || url_params[URL_PARAM_FIND]){
                back_to_search_results_btn.attr('href', SEARCH_PAGE_URL+'.'+TEMPLATE_FILETYPE+getSearchLinkParams(url_params) );
            }else{
                back_to_search_results_btn.remove();
            }
        }

        //set search type: offer, request or both
        var browse_type_switch = browse_filters_wrap.find("#browse-looking-for");
        if(url_params.search_type != null) browse_type_switch.val(url_params.search_type);

        //trigger new search when changing campaign-type (offer/request)
        browse_type_switch.change(function(evt){ $(evt.target).parents('form').submit(); });

        //apply search-query
        if(url_params[URL_PARAM_FIND] != null) $('#browse-search-inpt').val(url_params[URL_PARAM_FIND]);


        var all_filter_params = ["filter_minprice", "filter_maxprice", "filter_reach", "filter_location", "filter_minduration", "filter_maxduration"];

        //apply all filter values from URL-state
        for(var i=0; i < all_filter_params.length; i++){
            var filter_param = all_filter_params[i];

            if(url_params[filter_param] != null){
                browse_filters_wrap.find("*[name='"+filter_param+"']").val(url_params[filter_param]);
            }
        }

        //trigger init-search
        if(!is_search_detail_view) sendSearchRequest();
        else{
            var campaign_id = url_params[URL_PARAM_CAMPAIGN_ID];

            sendApiRequest(API_URLS.get_campaign_details, {'campaign_id':campaign_id}, onReceivedCampaignData);
        }
    }

    function sendSearchRequest()
    {
        var filter_data = extractSearchData($('#browse_filters form'));

        //check if we're on a detail page (then redirect)
        if($('#campaign_details').length == 1){
            jumpToPage( SEARCH_PAGE_URL+'.'+TEMPLATE_FILETYPE+getSearchLinkParams(filter_data) );
        }else{
            sendApiRequest(API_URLS.search, filter_data, onSearchResults);
            onSearchResults(); //todo: dummy fwrd
        }
    }

    function jumpToPage( page_url )
    {
        window.location.href = page_url;
    }

    //-------- LISTENER ---------

    function onUserQuickSearch(evt)
    {
        evt.preventDefault();
        jumpToPage( 'browse-4a.'+TEMPLATE_FILETYPE+'#'+URL_PARAM_FIND+'='+encodeURI( $(evt.target).find('input').val() ));
    }

    function onTriggerDetailSearch(evt)
    {
        evt.preventDefault();
        sendSearchRequest();
    }

    function onSearchResults(data)
    {
        //todo: just dummy linking
        var state_params = extractSearchData($('#browse_filters form'));
        state_params[URL_PARAM_CAMPAIGN_ID] = Math.round(Math.random()*100);

        var search_param_link = getSearchLinkParams( state_params, true );
        var all_search_entrys = $('#search_results_wrap .search_result');

        all_search_entrys.data('href', './browse-4b.'+TEMPLATE_FILETYPE+search_param_link);
        all_search_entrys.click(function(evt){
            evt.preventDefault();
            jumpToPage( $(evt.currentTarget).data('href') );
        });
    }

    function onReceivedCampaignData(data)
    {
        console.log('campaign-data: ',data);
    }

    function onUserLogin(evt)
    {
        evt.preventDefault();

        sendApiRequest(API_URLS.signin, extractFormData(evt.target), onUserLoginResponse);

    }

    function onUserLoginResponse(data)
    {
        console.log('login-response: ',data);
        window.location.href = "./profile-3b."+TEMPLATE_FILETYPE;
    }

    function onUserLogout(evt)
    {
        evt.preventDefault();

        sendApiRequest(API_URLS.logout, extractFormData(evt.target), onUserLoginResponse); //todo: just dummy
        window.location.href = "./"; //go back to landing-page
    }

    //---- registration ----
    function onSelectAccountType(evt)
    {
        var target = $(evt.target);
        var business_btn = $('#b-firm-plan');
        var individual_btn = $('#b-individual-plan');

        var is_business = (target.attr('id') == business_btn.attr('id'));
        var register_type_field = $('#registration_form input[name="user_type"]');

        if(is_business){
            individual_btn.fadeTo(200,0.3);
            business_btn.fadeTo(200,1);
            register_type_field.val('business');
        }else{
            individual_btn.fadeTo(200,1);
            business_btn.fadeTo(200,0.3);
            register_type_field.val('advertiser');
        }

        $('#registration_data_wrap').slideDown();
    }

    function onSubmitRegistration(evt)
    {
        evt.preventDefault();

        var register_data = extractFormData($('#registration_form'));
        sendApiRequest( API_URLS.signup, register_data, onRegisterResponse );
    }

    function onRegisterResponse(data)
    {
        var registration_content = $('#registration_content_wrap');
        registration_content.empty();

        registration_content.html($('#register_success_msg').html());
        $(document).scrollTop(0);
    }

    //----- user profile -----
    function onEditUserProfile(evt)
    {
        evt.preventDefault();

        var profile_data = extractFormData($('#kwarkee_userprofile'));
        sendApiRequest( API_URLS.update_profile, profile_data, onEditUserProfileResponse );
    }

    function onEditUserProfileResponse(data)
    {
        console.log(data);
        alert("Your profile changes were saved successfully!");
    }

})();