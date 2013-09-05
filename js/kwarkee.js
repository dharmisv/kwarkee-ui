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
        'search':'search/',
        'get_campaign_details': 'campaign/details',
        'get_feat_campaigns': 'campaign/featured'
    };

    var URL_PARAM_FIND = 'search_query';
    var URL_PARAM_CAMPAIGN_ID = 'cpid';
    var SEARCH_PAGE_URL = './browse-4a';
    var DETAIL_PAGE_URL = './browse-4b';

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

        //featured campaigns on landing-page
        var feat_requests = $('#kwarkee_feat_requests');
        if(feat_requests.length == 1){
            sendApiRequest(API_URLS.get_feat_campaigns,{}, onFeaturedCampaignsResponse);
            onFeaturedCampaignsResponse(); //todo: dummy
        }

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

    function applyFeatCampaignData( feat_campaign_node, container_node, campaign_data )
    {

        feat_campaign_node.find('img').attr('src', campaign_data.image);
        feat_campaign_node.find('.price').html( campaign_data.price );
        feat_campaign_node.find('h5').html(campaign_data.title);
        feat_campaign_node.find('p').html(campaign_data.description);
        feat_campaign_node.appendTo(container_node);

        feat_campaign_node.click(function(evt){
            jumpToPage( DETAIL_PAGE_URL + '.' + TEMPLATE_FILETYPE + '#'+URL_PARAM_CAMPAIGN_ID+'='+campaign_data.campaign_id );
        })
    }

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
            onReceivedCampaignData();//todo: debug
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

            //todo: dummy
            /*onSearchResults([
                {
                    "id": 21,
                    "description": "some random description",
                    "username": "dharmi",
                    "duration": 4,
                    "city": "San Francisco",
                    "title": "Sports shop",
                    "profileImage": "img/Offer.jpg",
                    "bigImage": "",
                    "price": 300,
                    "categoryId": 0,
                    "reachType": 'local',
                    "zip": 0,
                    "videoTitle": "",
                    "videoUrl": "",
                    "featured": false
                }
            ]);*/ //todo: dummy fwrd
        }
    }

    function jumpToPage( page_url )
    {
        window.location.href = page_url;
    }

    function applyCampaignBaseMetaInf( campaign_node, camapign_data )
    {
        campaign_node.find('.attr_price span').html( camapign_data.price);
        campaign_node.find('.attr_location span').html( camapign_data.city);
        campaign_node.find('.attr_duration span').html( camapign_data.duration+' days');
        campaign_node.find('.attr_reach span').html( camapign_data.reachType);
    }

    //-------- LISTENER ---------

    function onFeaturedCampaignsResponse(data)
    {
        var feat_offers = $('#kwarkee_feat_offers');
        var feat_requests = $('#kwarkee_feat_requests');
        var ref_feat_entry = $('#dummy_feat_campaign > div');

        for(var i=0; i < 3; i++){
            var new_entry = ref_feat_entry.clone();

            //todo: use API-data
            applyFeatCampaignData( new_entry, feat_offers, {
                'image': 'img/Offer.jpg',
                'title': 'random title',
                'price': Math.round(Math.random()*900),
                'description': 'description random',
                'campaign_id': Math.round(Math.random()*88)
            } );
        }

        for(var i=0; i < 3; i++){
            var new_entry = ref_feat_entry.clone();

            //todo: use API-data
            applyFeatCampaignData( new_entry, feat_requests, {
                'image': 'img/Offer.jpg',
                'title': 'random title',
                'price': Math.round(Math.random()*900),
                'description': 'description random',
                'campaign_id': Math.round(Math.random()*88)
            } );
        }
    }

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

    /**
     * @param data: array of result-objects
     */
    function onSearchResults(data)
    {
        var state_params = extractSearchData($('#browse_filters form'));
        var search_res_wrap = $('#search_results_wrap');
        var dummy_search_entry = $('#kwarkee_search_result_dummy > div');

        search_res_wrap.html('<hr/>'); //empty first

        //output all search results
        if(data.length > 0){

            for(var i=0; i < data.length; i++){
                var tmp_result_data = data[i];
                var tmp_search_entry = dummy_search_entry.clone();
                var tmp_state_params = $.extend({}, state_params); //clone

                //apply detail link to the search result
                tmp_state_params[URL_PARAM_CAMPAIGN_ID] = tmp_result_data.id;
                var search_param_link = getSearchLinkParams( tmp_state_params, true );
                tmp_search_entry.click(function(evt){
                    jumpToPage( './browse-4b.'+TEMPLATE_FILETYPE+search_param_link );
                });

                //todo: apply all the data of the search result from API
                tmp_search_entry.find('.searchresult_preview_img').attr('src', 'img/Offer.jpg'); //todo: this was still missing in MODEL

                tmp_search_entry.find('.searchresult_title').html( tmp_result_data.title);
                applyCampaignBaseMetaInf( tmp_search_entry, tmp_result_data);

                tmp_search_entry.find('.searchresult_description').html( tmp_result_data.description );
                tmp_search_entry.find('.searchresult_creator_img').attr( 'src', tmp_result_data.profileImage );

                tmp_search_entry.appendTo(search_res_wrap);
            }

        }else{
            $('<p>no results found for your search...</p>').appendTo(search_res_wrap);
        }
    }

    function onReceivedCampaignData(data)
    {
        console.log('campaign-data: ',data);

        //todo: just dummy-data
        /*data = {
            "id": 21,
            "description": "some random description",
            "username": "dharmi",
            "duration": 2,
            "city": "San Jose",
            "title": "Sports shop",
            "profileImage": "img/profile-pic.jpg",
            "bigImage": "img/Slides-2.jpg",
            "price": 300,
            "categoryId": 0,
            "reachType": "local",
            "zip": 0,
            "videoTitle": "",
            "videoUrl": "",
            "featured": false
        };*/

        var campaign_details = $('#campaign_details');

        //apply the detail-data
        campaign_details.find('#campaign_data h3').html(data.title);
        campaign_details.find('#campaign_data img').attr('src',data.bigImage);
        campaign_details.find('#campaign_data #campaign_description').html(data.description);


        applyCampaignBaseMetaInf(campaign_details, data);

        //creator info
        campaign_details.find('#creator_data img').attr( 'src', data.profileImage );
        campaign_details.find('#creator_data .attr_creator_username').html( data.username );
        campaign_details.find('#creator_data .attr_creator_location').html( data.city );
        campaign_details.find('#creator_data .attr_creator_description').html( 'some random description of the user' ); //todo: missing in model
    }

    function onUserLogin(evt)
    {
        evt.preventDefault();

        sendApiRequest(API_URLS.signin, extractFormData(evt.target), onUserLoginResponse);

    }

    function onUserLoginResponse(data)
    {
        jumpToPage("./profile-3b."+TEMPLATE_FILETYPE);
    }

    function onUserLogout(evt)
    {
        evt.preventDefault();

        sendApiRequest(API_URLS.logout, extractFormData(evt.target), onUserLoginResponse); //todo: just dummy
        jumpToPage('./'); //go back to landing-page
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