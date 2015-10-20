<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Image;

/**
 * Controller to create the Map
 */
class MapController extends Controller {

    /**
     * Main method that returns the index of the app
     * 
     * @return HTML
     */
    public function index() {
        $google_api_key = config('formstack.google_api_key');

        return view('map', ['google_api_key' => $google_api_key]);
    }

    /**
     * Creates an icon marker with a number when applicable.
     * 
     * @param   Number  $value  Number for the icon. If not informed, creates an
     *                          icon with no number.
     * 
     * @return  Image           The icon in a PNG \Intervention\Image format
     */
    public function getIcon($value = '') {
        $number = intval($value, 10);
        
        if($number > 99){
            $number = 99;
        }

        // create Image from file
        $img = Image::make(public_path('images/marker.png'));

        // use callback to define details
        $img->text($number, 33, 18, function($font) {
            $font->file(base_path('resources/assets/fonts/Ubuntu-M.ttf'));
            $font->size(32);
            $font->color('#308D20');
            $font->align('center');
            $font->valign('top');
            $font->angle(0);
        });

        return $img->response('png');
    }

    /**
     * Creates a text marker.
     * 
     * @param   String  $value  Text for the marker.
     * 
     * @return  Image           The icon in a PNG \Intervention\Image format
     */
    public function getTextMarker($value) {
        $arrTextSize = imagettfbbox(28, 0,
                base_path('resources/assets/fonts/Roboto-Medium.ttf'), $value);
        
        $img = Image::canvas($arrTextSize[2] + 24, 42);
        
        $img->circle(24, 16, 16, function ($draw) {
            $draw->background('#CCCCCC');
        });
        
        $img->circle(24, 16, 16, function ($draw) {
            $draw->background('#FFFFFF');
        });
        
        $img->rectangle(12, 12, 20, 20, function ($draw) {
            $draw->background('#8d6e63');
        });
        
        $img->text($value, 32, 2, function($font) {
            $font->file(base_path('resources/assets/fonts/Roboto-Regular.ttf'));
            $font->size(28);
            $font->color('#FFFFFF');
            $font->align('left');
            $font->valign('top');
            $font->angle(0);
        });
        
        $img->text($value, 34, 4, function($font) {
            $font->file(base_path('resources/assets/fonts/Roboto-Regular.ttf'));
            $font->size(28);
            $font->color('#FFFFFF');
            $font->align('left');
            $font->valign('top');
            $font->angle(0);
        });
        
        $img->text($value, 32, 6, function($font) {
            $font->file(base_path('resources/assets/fonts/Roboto-Regular.ttf'));
            $font->size(28);
            $font->color('#FFFFFF');
            $font->align('left');
            $font->valign('top');
            $font->angle(0);
        });
        
        $img->text($value, 30, 4, function($font) {
            $font->file(base_path('resources/assets/fonts/Roboto-Regular.ttf'));
            $font->size(28);
            $font->color('#FFFFFF');
            $font->align('left');
            $font->valign('top');
            $font->angle(0);
        });
        
        $img->text($value, 32, 4, function($font) {
            $font->file(base_path('resources/assets/fonts/Roboto-Regular.ttf'));
            $font->size(28);
            $font->color('#444444');
            $font->align('left');
            $font->valign('top');
            $font->angle(0);
        });

        return $img->response('png');
    }

}
