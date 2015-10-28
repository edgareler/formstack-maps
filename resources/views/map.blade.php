<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
        <title>Formstack Places Review</title>
        <link rel="icon" type="image/png" href="/images/icon.png" />
        <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:400,100,500,700"  type="text/css" />
        <link rel="stylesheet" href="/stylesheets/application.css" type="text/css" />
        <script src="//code.jquery.com/jquery-1.11.3.min.js"></script>
        <script src="//maps.googleapis.com/maps/api/js?key=@yield('google_api_key')&sensor=false&libraries=places"></script>
        <script src="/scripts/moment.min.js"></script>
        <script src="/scripts/scripts.js"></script>
    </head>
    <body>
        <div id="top">
            <svg version="1.1" viewBox="0 0 21.895 32" id="logo">
                <g style="fill:#51af42; fill-opacity:1" transform="matrix(0.5,0,0,0.5,-5.0525005,0)">
                    <circle cx="32" cy="22" r="18" style="fill:#FFFFFF" />
                    <path d="M 53.895,21.895 C 53.895,9.803 44.092,0 32,0 19.907,0 10.105,9.803 10.105,21.895 c 0,4.033 1.108,7.798 3.011,11.042 L 13.113,32.941 32,64 50.886,32.941 50.882,32.937 c 1.903,-3.244 3.013,-7.01 3.013,-11.042 z M 32,37.578 c -8.663,0 -15.684,-7.021 -15.684,-15.684 0,-8.662 7.021,-15.684 15.684,-15.684 8.662,0 15.683,7.022 15.683,15.684 C 47.684,30.557 40.662,37.578 32,37.578 z" style="fill:#51af42;fill-opacity:1"/>
                    <polygon points="31.895,28.581 40.486,33.873 38.293,24.023 45.98,17.487 35.936,16.529 32.094,7.197 28.08,16.456 18.019,17.224 25.582,23.903 23.205,33.71 " style="fill:#51af42;fill-opacity:1" />
                </g>
            </svg>
            <input type="text" id="placeSearch" name="placeSearch" placeholder="Search a Place or Location">
        </div>
        
        <div id="map_canvas"></div>
        
        <div id="formstack"></div>
    </body>
</html>
