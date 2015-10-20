/**
 * Main application script
 * 
 * @author Edgar Eler <eler@edgar.systems>
 * @link http://edgar.systems
 */
(function() {
    'use strict';

    /**
     * Google Maps API main variables
     */
    var map, geocoder, service, autocomplete;

    /**
     * Map Markers Arrays
     * 
     * @type Array
     */
    var formIconMarkers = [];
    var googleMarkers = [];

    /**
     * Array of Google Places objects
     * 
     * Default Structure:
     * @link https://developers.google.com/maps/documentation/javascript/3.exp/reference#PlaceResult
     * 
     * @type Array
     */
    var googlePlaces = [];

    /**
     * Array of Formstack place objects.
     * 
     * Default object structure:
     *  place {
     *      place: 'Place Name',
     *      address: 'Place Address',
     *      reviews: [
     *          {
     *              name: 'John Doe',
     *              rate: 5,
     *              review: 'John Review 1'
     *          }
     *      ],
     *      position: google.maps.LatLng
     *  }
     * 
     * @type Array
     */
    var places = [];

    /**
     * Array of InfoWindows
     * 
     * @type Array
     */
    var gmInfoWindows = [];

    /**
     * Reference Address object
     * 
     * Default object structure:
     *  referenceAddress {
     *      street: '8604 Allisonville Rd. Suite 300',
     *      city: 'Indianapolis',
     *      state: 'IN',
     *      zip: '46250',
     *      country: 'US'
     *  }
     * 
     * @type Object
     */
    var referenceAddress = {};

    /**
     * Formstack Review Form fields IDs Object
     * 
     * Default object structure:
     *  referenceAddress {
     *      place: 'Formstack LLC',
     *      address: '8604 Allisonville Rd #300, Indianapolis, IN 46250',
     *      googleplaceid: 'ChIJGxyc1ydNa4gR_PNLybWBVWA'
     *  }
     * 
     * @type Object
     */
    var formInputIds = {};
    
    /**
     * Variables for the map and its services
     */
    var shapeIcon = {};
    var lastCenterCall = 0;
    var lastZoomCall = 0;
    var zoomLevel = 17;
    var minZoomLevel = 17;
    var requestPlaces = {
        radius: '1000',
        types: [
            'food',
            'lodging',
            'park',
            'restaurant'
        ]
    };
    
    /**
     * Get Address name from a position
     * 
     * @param   {google.maps.LatLng}    latlng
     * @param   {function}              callback
     */
    function getAddress(latlng, callback) {
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    var address = {};

                    for (var i = 0; i < results.length; i++) {
                        if (results[i].types[0] === 'street_address') {
                            address.street =
                                results[i].address_components[0].short_name
                                + ' '
                                + results[i].address_components[1].short_name;
                            address.city = results[i].address_components[2]
                                .short_name;
                        }

                        if (results[i].types[0] === 'locality') {
                            address.city = results[i].address_components[0]
                                .short_name;
                        }

                        if (results[i].types[0] === 'postal_code') {
                            address.zip = results[i].address_components[0]
                                .short_name;
                        }

                        if (results[i].types[0] ===
                            'administrative_area_level_1') {
                            address.state = results[i].address_components[0]
                                .short_name;
                        }

                        if (results[i].types[0] === 'country') {
                            address.country = results[i].address_components[0]
                                .short_name;
                        }
                    }

                    if (address) {
                        callback(address);
                    }
                }
            }
        });
    }

    /**
     * Function to change the referenceAddress property, if has changed.
     * 
     * @param {string} address
     */
    function setReferenceAddress(address) {
        if (!referenceAddress || referenceAddress.city !== address.city) {
            referenceAddress = address;

            loadSubmissionPlaces();
        }
    }

    /**
     * Function to load the places of current city, based on the map center, 
     * from the submissions at Formstack.
     */
    function loadSubmissionPlaces() {
        $.getJSON('/places/' + referenceAddress.city, function(data) {
            $.each(data, function(key, val) {
                var place = {
                    place: val.place,
                    address: val.address,
                    reviews: [{
                            submission_id: val.submission_id,
                            timestamp: val.timestamp,
                            name: val.name,
                            rate: val.rate,
                            review: val.review
                        }]
                };

                var googlePlaceIndex;

                if (val.googleplaceid) {
                    place.googleplaceid = val.googleplaceid;

                    googlePlaceIndex = findGooglePlace(val.googleplaceid);
                }

                var placeIndex = parseInt(findPlace(place));

                if (placeIndex === -1) {
                    placeIndex = places.length;

                    places[placeIndex] = place;

                    if (googlePlaceIndex && googlePlaceIndex !== -1) {
                        places[placeIndex].position =
                            googlePlaces[googlePlaceIndex].geometry.location;

                        addFormMarker(placeIndex);
                    } else {
                        getPlaceDetails(placeIndex, loadGooglePlaces);
                    }
                } else {
                    var submissionIndex = findSubmission(placeIndex,
                        place.reviews[0].submission_id);

                    if (submissionIndex === -1) {
                        places[placeIndex]
                            .reviews[places[placeIndex].reviews.length] =
                            place.reviews[0];

                        addFormMarker(placeIndex);
                    }
                }

                if (googlePlaceIndex && googlePlaceIndex !== -1) {
                    gmInfoWindows[googlePlaceIndex] = createInfoWindow(
                        googlePlaceIndex);
                }
            });
        });
    }

    /**
     * Find a Place object in the array places.
     * 
     * @param   {Object}    place   Place object to search in the array places
     * 
     * @returns {Number}            Index of the place object, or -1 when not
     *                              found.
     */
    function findPlace(place) {
        for (var p in places) {
            /*if (places[p].place === place.place
             && places[p].address === place.address) {*/
            if (places[p].googleplaceid === place.googleplaceid) {
                return p;
            }
        }

        return -1;
    }

    /**
     * Find a Place object in the array places by its Google Place ID.
     * 
     * @param   {String}    googlePlaceId   Google Place ID
     * 
     * @returns {Number}                    Index of the place object, or -1
     *                                      when not found.
     */
    function findPlaceByGoogleId(googlePlaceId) {
        for (var p in places) {
            if (places[p].googleplaceid
                && places[p].googleplaceid === googlePlaceId) {
                return p;
            }
        }

        return -1;
    }

    /**
     * Find a submission (review) based on its ID
     * 
     * @param   {Number}    placeId         The places array item index
     * @param   {Number}    submissionId    The submission ID
     * 
     * @returns {Number}                    The index of the submission
     */
    function findSubmission(placeId, submissionId) {
        for (var p in places[placeId].reviews) {
            if (places[placeId].reviews[p].submission_id === submissionId) {
                return p;
            }
        }

        return -1;
    }

    /**
     * Find a Google Place object in the array googlePlaces.
     * 
     * @param   {Object}    googlePlaceId   Google place id searched
     * 
     * @returns {Number}                    Index of the google place object, or
     *                                      -1 when not found.
     */
    function findGooglePlace(googlePlaceId) {
        for (var g in googlePlaces) {
            if (googlePlaces[g].place_id === googlePlaceId) {
                return g;
            }
        }

        return -1;
    }

    /**
     * Redirects the marker click event to openMarker function.
     */
    function markerClick() {
        openMarker(this);
    }

    /**
     * Pan to a given marker and open its InfoWindow
     * 
     * @param {Object}  marker
     */
    function openMarker(marker) {
        var markerIndex = marker.get('markerIndex');

        closeInfoWindows();

        gmInfoWindows[markerIndex]
            .open(map, marker);

        map.panTo(googleMarkers[markerIndex].getPosition());
    }

    /**
     * Creates a new marker (icon) for a given places array item
     * 
     * @param   {Number}    placeIndex  The places array item index
     */
    function addFormMarker(placeIndex) {
        if (formIconMarkers[placeIndex]) {
            formIconMarkers[placeIndex].setMap();
        }

        var markerIcon = {
            url: '/icon/' + places[placeIndex].reviews.length,
            scaledSize: new google.maps.Size(33, 48),
            size: new google.maps.Size(66, 96),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(16, 48)
        };

        var zIndex = 1000 + parseInt(placeIndex);

        formIconMarkers[placeIndex] = new google.maps.Marker({
            map: map,
            position: places[placeIndex].position,
            icon: markerIcon,
            shape: shapeIcon,
            zIndex: zIndex,
            anchorPoint: new google.maps.Point(0, 0)
        });

        var googlePlaceIndex;

        if (places[placeIndex].googleplaceid) {
            googlePlaceIndex = findGooglePlace(
                places[placeIndex].googleplaceid);

            if (googlePlaceIndex && googlePlaceIndex !== -1) {
                formIconMarkers[placeIndex].set('markerIndex', googlePlaceIndex);
                formIconMarkers[placeIndex].addListener('click', markerClick);
            }
        }
    }

    /**
     * Creates a new marker (text) for a given googlePlaces array item
     * 
     * @param {Number}  googlePlaceIndex    The googlePlaces array item index
     * @param {Boolean} openGoogleMarker    Open this marker, if applicable
     */
    function addGoogleMarker(googlePlaceIndex, openGoogleMarker) {
        var googlePlace = googlePlaces[googlePlaceIndex];

        var textUri = encodeURIComponent(googlePlace.name.replace('/', ' '));

        var textImg = new Image();
        textImg.src = '/text/' + textUri;
        textImg.googlePlaceIndex = googlePlaceIndex;
        textImg.textUri = textUri;
        textImg.openGoogleMarker = openGoogleMarker;

        textImg.onload = function() {
            var textUri = this.textUri;
            var googlePlaceIndex = this.googlePlaceIndex;

            var googlePlace = googlePlaces[googlePlaceIndex];

            var textMarkerIcon = {
                url: '/text/' + this.textUri,
                scaledSize: new google.maps
                    .Size(parseInt(this.width / 2),
                        parseInt(this.height / 2)),
                anchor: new google.maps.Point(8, 8)
            };

            var mapToAdd = map;

            if (zoomLevel < minZoomLevel) {
                mapToAdd = null;
            }

            googleMarkers[googlePlaceIndex] = new google.maps.Marker({
                map: mapToAdd,
                position: googlePlace.geometry.location,
                icon: textMarkerIcon,
                zIndex: googlePlaceIndex,
                anchorPoint: new google.maps.Point(0, 0)
            });

            googleMarkers[googlePlaceIndex].set('markerIndex', googlePlaceIndex);

            gmInfoWindows[googlePlaceIndex] = createInfoWindow(googlePlaceIndex);

            googleMarkers[googlePlaceIndex].addListener('click', markerClick);

            if (this.openGoogleMarker === true) {
                openMarker(googleMarkers[googlePlaceIndex]);
            }
        };
    }

    /**
     * Loads the Google Places on the map, based on the results and status of
     * a service request.
     * 
     * @param {Array}   results             The results array or object
     * @param {Number}  status              The status of the request
     * @param {Boolean} openGoogleMarker    Open or not a marker (applicable for
     *                                      single place load)
     */
    function loadGooglePlaces(results, status, openGoogleMarker) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            var resultList = results;

            if (Array.isArray(results) === false) {
                resultList = [results];
            }

            var resultsCount = resultList.length;

            for (var i = 0; i < resultsCount; i++) {
                var googlePlaceId = findGooglePlace(resultList[i].place_id);

                if (googlePlaceId === -1) {
                    var googlePlaceIndex = googlePlaces.length;

                    googlePlaces[googlePlaceIndex] = resultList[i];

                    addGoogleMarker(googlePlaceIndex, openGoogleMarker);

                    var placeIndex = findPlaceByGoogleId(
                        resultList[i].place_id);

                    if (placeIndex && placeIndex !== -1) {
                        places[placeIndex].position =
                            resultList[i].geometry.location;
                        addFormMarker(placeIndex);
                    }
                }
            }
        }
    }
    
    /**
     * Creates an InfoWindow for a given googlePlaces array item
     * 
     * @param   {Number}    googlePlaceIndex    The googlePlaces array item
     *                                          index.
     * 
     * @returns {google.maps.InfoWindow}        The InfoWindow created
     */
    function createInfoWindow(googlePlaceIndex) {
        var googlePlace = googlePlaces[googlePlaceIndex];

        var address = googlePlace.formatted_address;

        var rating = '';

        if (!address) {
            address = googlePlace.vicinity;
        }

        var placeIndex = findPlaceByGoogleId(googlePlace.place_id);

        if (placeIndex !== -1) {
            rating = getRatingHtml(placeIndex).outerHTML;
        }

        var contentString = '<div class="infoTitle">'
            + googlePlace.name
            + '</div>'
            + '<div class="infoAddress">'
            + address
            + '</div>'
            + rating
            + '<div class="infoReviewButton">'
            + '<a href="#form/' + googlePlaceIndex + '">'
            + '<img src="/images/icon.png"> Review this Place'
            + '</a>'
            + '</div>'
            ;

        return new google.maps.InfoWindow({
            content: contentString
        });
    }

    /**
     * Function to refresh the submission Places.
     */
    function refreshPlaces() {
        closeInfoWindows();

        home();

        loadSubmissionPlaces();
    }

    /**
     * Remove or insert (show) the Google Place markers on the map
     * 
     * @param {Boolean} show
     */
    function toggleGoogleMarkers(show) {
        for (var m in googleMarkers) {
            if (show === true) {
                googleMarkers[m].setMap(map);
            } else {
                googleMarkers[m].setMap();
            }
        }
    }

    /**
     * Closes all InfoWindows
     */
    function closeInfoWindows() {
        for (var i in gmInfoWindows) {
            gmInfoWindows[i].close();
        }
    }

    /**
     * Opens the reviews of a Place
     * 
     * @param {Number}  placeIndex  The index of the places array.
     */
    function openPlaceReviews(placeIndex) {
        var place = places[placeIndex];

        var divReviews = document.createElement('div');
        divReviews.setAttribute('class', 'reviews');

        var divInnerReviews = document.createElement('div');
        divInnerReviews.setAttribute('class', 'innerReviews');

        var divPlaceName = document.createElement('div');
        divPlaceName.setAttribute('class', 'placeName');

        var textPlaceName = document.createTextNode(place.place);

        divPlaceName.appendChild(textPlaceName);

        var divPlaceAddress = document.createElement('div');
        divPlaceAddress.setAttribute('class', 'placeAddress');

        var textPlaceAddress = document.createTextNode(place.address);

        divPlaceAddress.appendChild(textPlaceAddress);

        var divPlaceRating = document.createElement('div');
        divPlaceRating.setAttribute('class', 'placeRating');

        var spanRatingNumber = document.createElement('span');
        spanRatingNumber.setAttribute('class', 'ratingNumber');

        var textRatingNumber = document.createTextNode(getRating(placeIndex));

        spanRatingNumber.appendChild(textRatingNumber);

        var spanRatingStars = document.createElement('span');
        spanRatingStars.setAttribute('class', 'ratingStars');

        var textRatingStars = document.createTextNode(getRatingStars(placeIndex));

        spanRatingStars.appendChild(textRatingStars);

        var spanRatingCount = document.createElement('span');
        spanRatingCount.setAttribute('class', 'ratingCount');

        var textRatingCount = document.createTextNode(place.reviews.length + ' reviews');

        spanRatingCount.appendChild(textRatingCount);

        divPlaceRating.appendChild(spanRatingNumber);
        divPlaceRating.appendChild(spanRatingStars);
        divPlaceRating.appendChild(spanRatingCount);

        var divPlaceReviews = document.createElement('div');
        divPlaceReviews.setAttribute('class', 'placeReviews');

        for (var i in place.reviews) {
            var divSingleReview = document.createElement('div');
            divSingleReview.setAttribute('class', 'singleReview');

            var divReviewAuthor = document.createElement('div');
            divReviewAuthor.setAttribute('class', 'reviewAuthor');

            var textReviewAuthor = document
                .createTextNode(place.reviews[i].name);

            divReviewAuthor.appendChild(textReviewAuthor);

            var divReviewDate = document.createElement('div');
            divReviewDate.setAttribute('class', 'reviewDate');

            var reviewDate = new Date(place.reviews[i].timestamp);

            var textReviewDate = document
                .createTextNode(reviewDate.toLocaleDateString());

            divReviewDate.appendChild(textReviewDate);

            var divReviewDesc = document.createElement('div');
            divReviewDesc.setAttribute('class', 'reviewDesc');

            var spanSingleRatingStars = document.createElement('span');
            spanSingleRatingStars.setAttribute('class', 'ratingStars');

            var textSingleRatingStars = document
                .createTextNode(toStars(parseInt(place.reviews[i].rate), 5));

            spanSingleRatingStars.appendChild(textSingleRatingStars);

            var spanSingleReview = document.createElement('span');
            spanSingleReview.innerHTML = place.reviews[i].review;

            divReviewDesc.appendChild(spanSingleRatingStars);
            divReviewDesc.appendChild(spanSingleReview);

            divSingleReview.appendChild(divReviewAuthor);
            divSingleReview.appendChild(divReviewDate);
            divSingleReview.appendChild(divReviewDesc);

            divPlaceReviews.appendChild(divSingleReview);
        }

        divInnerReviews.appendChild(divPlaceName);
        divInnerReviews.appendChild(divPlaceAddress);
        divInnerReviews.appendChild(divPlaceRating);
        divInnerReviews.appendChild(divPlaceReviews);

        divReviews.appendChild(divInnerReviews);

        document.getElementById('formstack').appendChild(divReviews);

        $('div#formstack').show();

        $('html').click(function() {
            if ($('div#formstack').is(':visible')) {
                home();
            }
        });

        $('div.reviews').click(function(event) {
            event.stopPropagation();
        });
    }

    /**
     * Open the custom Formstack Review Form to review a place
     * 
     * @param {Object} googlePlace  The Google Place to review
     */
    function openFormReview(googlePlace) {
        getAddress(googlePlace.geometry.location, function(address) {
            createIframe('formReview', 'formstack');

            var formIframe = 'div#formstack > iframe';

            $(formIframe).attr('src', '/form');

            $('div#formstack').show();

            $('html').click(function() {
                if ($('div#formstack').is(':visible')) {
                    home();
                }
            });

            $(formIframe).click(function(event) {
                event.stopPropagation();
            });

            $(formIframe).on('load', function() {
                console.log('load! <' + $(this).attr('src') + '>');

                if ($(this).attr('src') === '/form') {
                    try {
                        $(this).contents()
                            .find('#field' + formInputIds.place)
                            .val(googlePlace.name);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-address')
                            .val(address.street);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-city')
                            .val(address.city);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-state')
                            .val(address.state);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-zip')
                            .val(address.zip);
                        $(this).contents()
                            .find('#field' + formInputIds.googleplaceid)
                            .val(googlePlace.place_id);

                        $(this).contents()
                            .find('#field' + formInputIds.place)
                            .attr('readonly', true);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-address')
                            .attr('readonly', true);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-city')
                            .attr('readonly', true);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-state')
                            .attr('readonly', true);
                        $(this).contents()
                            .find('#field' + formInputIds.address + '-zip')
                            .attr('readonly', true);
                    } catch (e) {
                        setTimeout(refreshPlaces, 3000);
                    }
                }
            });
        });
    }

    /**
     * Close all popovers opened
     */
    function closePopovers() {
        $('div#formstack').hide();

        clearElement('formstack');
    }

    /**
     * Create and append the iframe to open the Formstack Review Form
     * 
     * @param {String} iframeId     ID of the new iframe
     * @param {String} container    ID of the iframe container
     */
    function createIframe(iframeId, container) {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('id', iframeId);
        iframe.setAttribute('src', 'about:blank');

        document.getElementById(container).appendChild(iframe);
    }

    /**
     * Clear the contents of an element
     * 
     * @param {String} elementId    ID of the element to clear
     */
    function clearElement(elementId) {
        document.getElementById(elementId).innerHTML = '';
    }

    /**
     * Load the Formstack Review Form fields IDs and then call the function to
     * initialize the map.
     */
    function loadFormInputs() {
        $.getJSON('/fields', function(data) {
            for (var i in data) {
                var val = data[i];

                if (val.name === 'place') {
                    formInputIds.place = val.id;
                } else if (val.name === 'address') {
                    formInputIds.address = val.id;
                } else if (val.name === 'googleplaceid') {
                    formInputIds.googleplaceid = val.id;
                }
            }

            initialize();
        });
    }

    /**
     * Start the Google Service to get the near places based on the
     * requestPlaces.
     */
    function getNearPlaces() {
        if (zoomLevel >= minZoomLevel) {
            requestPlaces.location = map.getCenter();

            service = new google.maps.places.PlacesService(map);
            service.nearbySearch(requestPlaces, loadGooglePlaces);
        }
    }
    
    /**
     * Get the details of a given item of the places array
     * 
     * @param {Number}      placeIndex      The places array item index
     * @param {Function}    callback        Function to call after success
     */
    function getPlaceDetails(placeIndex, callback) {
        var place = places[placeIndex];

        var request = {
            placeId: place.googleplaceid
        };

        service = new google.maps.places.PlacesService(map);
        service.getDetails(request, (function(callback) {
            return function(result, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    callback(result, status);
                }
            };
        })(callback));
    }

    /**
     * Initialize the map and its options
     */
    function initialize() {
        var mapOptions = {
            center: new google.maps.LatLng(39.9135052, -86.0779571),
            zoom: zoomLevel,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            rotateControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [
                        {visibility: "off"}
                    ]
                }
            ]
        };

        map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);

        geocoder = new google.maps.Geocoder();

        getAddress(map.getCenter(), setReferenceAddress);

        google.maps.event.addListener(map, 'center_changed', function() {
            var newTime = new Date().getTime();

            if (newTime - lastCenterCall > 500) {
                lastCenterCall = newTime;

                getAddress(map.getCenter(), setReferenceAddress);

                getNearPlaces();
            }
        });

        google.maps.event.addListener(map, 'zoom_changed', function() {
            var newTime = new Date().getTime();

            if (newTime - lastZoomCall > 500) {
                lastZoomCall = newTime;

                zoomLevel = map.getZoom();

                if (zoomLevel < minZoomLevel) {
                    toggleGoogleMarkers(false);
                } else {
                    toggleGoogleMarkers(true);
                }
            }
        });

        shapeIcon = {
            coords: [16, 48, 0, 22, 0, 9, 10, 0, 23, 0, 33, 9, 33, 22, 16, 48],
            type: 'poly'
        };

        getNearPlaces();

        var input = document.getElementById('placeSearch');

        autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);

        autocomplete.addListener('place_changed', function() {
            closeInfoWindows();

            var place = autocomplete.getPlace();

            loadGooglePlaces(place, google.maps.places.PlacesServiceStatus.OK, true);
        });
    }

    /**
     * Function to call the Home route
     */
    function home() {
        location.hash = '';
    }

    /**
     * Router function based on the location.hash
     * 
     * @param {String} hash     location.hash parameter from window.onhashchange
     *                          event
     */
    function route(hash) {
        var query = hash.split('/');

        if (query.length > 1) {
            var formRoute = '#form';
            var reviewsRoute = '#reviews';
            var placeId;

            if (query[1]) {
                placeId = parseInt(query[1]);
            }

            if (query[0] === formRoute) {
                openFormReview(googlePlaces[placeId]);
            } else if (query[0] === reviewsRoute) {
                openPlaceReviews(placeId);
            }
        } else {
            closePopovers();
        }
    }

    /**
     * Prevents the Backspace default behavior and route it to Home.
     * 
     * @param {Event} e
     */
    function preventBackspace(e) {
        if (e.which === 8 && !$(e.target).is("input, textarea")) {
            e.preventDefault();

            home();
        }
    }

    /**
     * Creates a full-empty Stars string based on number and max.
     * 
     * @param   {Number}    number  The actual number of stars
     * @param   {Number}    max     The max limit of stars.
     * 
     * @returns {String}            The stars string
     */
    function toStars(number, max) {
        var stars = '';

        for (var i = 1; i <= number; i++) {
            stars += '★';
        }

        for (var i = number + 1; i <= max; i++) {
            stars += '☆';
        }

        return stars;
    }

    /**
     * Calculate and get the rating of a given places array item
     * 
     * @param   {Number}    placeIndex  The places array item index.
     * 
     * @returns {Number}                The calculated review precise by 2.
     */
    function getRating(placeIndex) {
        var place = places[placeIndex];

        var sum = 0;

        for (var i = 0; i < place.reviews.length; i++) {
            sum += parseInt(place.reviews[i].rate);
        }

        var average = sum / place.reviews.length;

        return average.toPrecision(2);
    }

    /**
     * Get the rating stars string for a given places array item.
     * 
     * @param   {Number}    placeIndex  The places array item index
     * 
     * @returns {String}                The stars string for this rating
     */
    function getRatingStars(placeIndex) {
        var rating = parseInt(getRating(placeIndex));

        return toStars(rating, 5);
    }

    /**
     * Get the HTML of the rating for the rating of a given places array item.
     * 
     * @param   {Number}    placeIndex  The places array item index
     * 
     * @returns {Element}               The HTML result element
     */
    function getRatingHtml(placeIndex) {
        var place = places[placeIndex];

        var div = document.createElement('div');
        div.setAttribute('class', 'infoRating');

        var reviewsCount = place.reviews.length;

        var rating = getRating(placeIndex);

        var ratingText = getRatingStars(placeIndex);

        var textReviews = document.createTextNode(rating + ' ');

        var spanStars = document.createElement('span');

        var textStars = document.createTextNode(ratingText);

        spanStars.appendChild(textStars);

        var link = document.createElement('a');
        link.setAttribute('href', '#reviews/' + placeIndex);

        var strReviews = 'review';

        if (reviewsCount > 1) {
            strReviews += 's';
        }

        var textLink = document.createTextNode(reviewsCount + ' ' + strReviews);

        link.appendChild(textLink);

        div.appendChild(textReviews);
        div.appendChild(spanStars);
        div.appendChild(link);

        return div;
    }
    
    /**
     * Start the app after the onload event
     */
    window.onload = function() {
        home();

        loadFormInputs();

        $(document).on("keydown", preventBackspace);

        $(window).on("navigate", function(event, data) {
            var direction = data.state.direction;

            if (direction === 'back') {
                home();
            }
        });
    };

    /**
     * Forward the hash from onhashchange event to route function
     */
    window.onhashchange = function() {
        route(location.hash);
    };
})();