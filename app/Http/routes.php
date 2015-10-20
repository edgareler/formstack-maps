<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/',                 'MapController@index');
Route::get('/icon',             'MapController@getIcon');
Route::get('/icon/{value}',     'MapController@getIcon');
Route::get('/text/{value}',     'MapController@getTextMarker');
Route::get('/form',             'FormController@getFormHtml');
Route::get('/form/{id}',        'FormController@getFormHtml');
Route::get('/field/{name}',     'FormController@getFieldByName');
Route::get('/fields',           'FormController@getFormFields');
Route::get('/places',           'FormController@getPlaces');
Route::get('/places/{city}',    'FormController@getPlaces');
