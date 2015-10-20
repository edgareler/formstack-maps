<?php namespace App\Http;

use GuzzleHttp\Client;

/**
 * Helper to call REST Formstack API with GuzzleHttp
 */
class RestHelper {
    
    private $base_uri;
    private $timeout;
    private $oauth;
    private $client;
    
    /**
     * Constructor of the RestHelper
     * 
     * @param   String  $base_uri   Base URI. If not informed, get the default.
     * @param   Number  $timeout    Timeout. If not informed, get the default.
     * @param   String  $oauth      OAuth Token. If not informed, get the
     *                              default.
     */
    public function __construct($base_uri = '', $timeout = '', $oauth = '') {
        if($base_uri === ''){
            $this->base_uri = config('formstack.base_uri');
        } else {
            $this->base_uri = $base_uri;
        }
        
        if($timeout === ''){
            $this->timeout = config('formstack.timeout');
        } else {
            $this->timeout = $timeout;
        }
        
        if($oauth === ''){
            $this->oauth = config('formstack.oauth');
        } else {
            $this->oauth = $oauth;
        }
        
        $this->client = new Client([
            'base_uri' => $this->base_uri,
            'timeout' => $this->timeout
        ]);
    }
    
    /**
     * Main HTTP Request method
     * 
     * @param   String  $method     Method for the request
     * @param   String  $action     Action of the request
     * @param   String  $paramsKey  Key for params at the request
     * @param   Array   $params     Array params
     * 
     * @return  Object              The GuzzleHttp\Client request object
     */
    public function request($method, $action, $paramsKey = '', $params = []){
        $request = $this->client->request($method, $action, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->oauth
                ],
                $paramsKey => $params
        ]);
         
        return $request;
    }
    
    /**
     * Call the request method for a GET request
     * 
     * @param   String  $action     Action of the request
     * @param   Array   $params     Array params
     * 
     * @return  Object              The GuzzleHttp\Client request object
     */
    public function get($action, $params = []){
        return $this->request('GET', $action, 'query', $params);
    }
    
    /**
     * Call the request method for a POST request
     * 
     * @param   String  $action     Action of the request
     * @param   Array   $params     Array params
     * 
     * @return  Object              The GuzzleHttp\Client request object
     */
    public function post($action, $params = []){
        return $this->request('POST', $action, 'form_params', $params);
    }
    
}
