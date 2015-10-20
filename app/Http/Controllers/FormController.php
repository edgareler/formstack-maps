<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\RestHelper;

/**
 * Controller for integration with Formstack API
 */
class FormController extends Controller {

    /**
     * Get a Form object
     * 
     * @param   Number  $formId     ID of the form at Formstack. If not 
     *                              informed, get the default form.
     * 
     * @return  JSON                The JSON object of the form.
     */
    public function getForm($formId = '') {
        $client = new RestHelper();

        if ($formId === '') {
            $formId = config('formstack.default_form_id');
        }

        $response = $client->get('form/' . $formId);

        return $response->getBody();
    }

    /**
     * Get HTML of a Form object
     * 
     * @param   Number  $formId     ID of the form at Formstack. If not 
     *                              informed, get the default form.
     * 
     * @return  HTML                The HTML property of the Form object.
     */
    public function getFormHtml($formId = '') {
        $jsonObj = json_decode($this->getForm($formId));

        if (property_exists($jsonObj, 'html')) {
            return $jsonObj->html;
        }
    }

    /**
     * 
     * Get the fields of a Form
     * 
     * @param   Number  $formId     ID of the form at Formstack. If not 
     *                              informed, get the default form.
     * 
     * @return  JSON                A JSON object with the fields.
     */
    public function getFormFields($formId = '') {
        $client = new RestHelper();

        if ($formId === '') {
            $formId = config('formstack.default_form_id');
        }

        $response = $client->get('form/' . $formId . '/field');

        return $response->getBody();
    }

    /**
     * Get submissions from a given form, filtered by search field if applicable
     * 
     * @param   Number  $formId             ID of the form at Formstack. If not 
     *                                      informed, get the default form.
     * @param   Array   $searchFieldIds     IDs of the search fields.
     * @param   Array   $searchFieldValues  Values of the search fields
     * 
     * @return  JSON                        JSON object with the submissions
     */
    public function getFormSubmissions($formId = '', $searchFieldIds = array(), $searchFieldValues = array()) {
        $client = new RestHelper();

        if ($formId === '') {
            $formId = config('formstack.default_form_id');
        }

        $fieldIdCount = count($searchFieldIds);

        $arguments = array();

        for ($i = 0; $i < $fieldIdCount; $i++) {
            $arguments['search_field_' . $i] = $searchFieldIds[$i];
            $arguments['search_value_' . $i] = $searchFieldValues[$i];
        }

        $arguments['data'] = 'true';
        $arguments['sort'] = 'DESC';

        $response = $client->get('form/' . $formId . '/submission', $arguments);

        return $response->getBody();
    }

    /**
     * Get places of a given city from submissions.
     * 
     * @param   String  $city   A city to search for places. If not informed,
     *                          list all places from submissions.
     * 
     * @return  JSON            A JSON object with the returned Places.
     */
    public function getPlaces($city = '') {
        $searchFieldIds = array();
        $searchFieldValues = array();

        $fieldList = ['name', 'place', 'address', 'rate', 'review',
            'googleplaceid', 'timestamp'];

        $fieldIds = $this->getFieldsByNames($fieldList);

        if ($city !== '') {
            $searchFieldIds[0] = $fieldIds['address'];
            $searchFieldValues[0] = $city;
        }

        $formSubmissions = $this->getFormSubmissions('', $searchFieldIds, $searchFieldValues);

        $jsonObj = json_decode($formSubmissions);

        if (count($jsonObj) > 0 && property_exists($jsonObj, 'submissions')) {
            $placeList = array();

            $submissionsCount = count($jsonObj->submissions);

            for ($i = 0; $i < $submissionsCount; $i++) {

                $submission = $jsonObj->submissions[$i];

                if (property_exists($submission, 'id')) {
                    $place = $this->getItemPlace(
                            $submission->data, $fieldIds
                    );

                    $place['submission_id'] = $submission->id;
                    $place['timestamp'] = $submission->timestamp;
                }

                $placeList[$i] = $place;
            }

            return json_encode($placeList);
        }
    }

    /**
     * 
     * Get the Place array item based on a list of data from a submission.
     * 
     * @param   array   $listData
     * @param   array   $fieldIds
     * 
     * @return  array
     */
    public function getItemPlace($listData, $fieldIds) {
        $place = array();

        foreach ($listData as $key => $data) {
            $fieldIndex = array_search($key, $fieldIds);

            if ($fieldIndex !== false) {
                $value = $this->fixField($fieldIndex, $data->value);

                if ($fieldIndex === 'review') {
                    $value = str_replace("\r\n", "<br>", $value);
                }

                $place[$fieldIndex] = $value;
            }
        }

        return $place;
    }

    /**
     * Fix the field by calling the properly fix function, if applicable.
     * 
     * @param   string  $fieldName      The field name
     * @param   string  $fieldValue     The field original value
     * 
     * @return  string                  The fixed field value
     */
    public function fixField($fieldName, $fieldValue) {
        switch ($fieldName) {
            case 'address':
                $fixedValue = $this->fixAddress($fieldValue);
                break;

            case 'name':
                $fixedValue = $this->fixName($fieldValue);
                break;

            default:
                $fixedValue = $fieldValue;
        }

        return $fixedValue;
    }

    /**
     * Fix the name by replacing the declared properties by commas and
     * spaces.
     * 
     * @param   string  $name   The original name
     * 
     * @return  string          The fixed name
     */
    public function fixName($name) {
        $nameFix1 = str_replace("first = ", '', $name);
        $nameFix2 = str_replace("\nlast = ", ' ', $nameFix1);

        return $nameFix2;
    }

    /**
     * Fix the address by replacing the declared properties by commas and
     * spaces.
     * 
     * @param   string  $address    The original address
     * 
     * @return  string              The fixed address
     */
    public function fixAddress($address) {
        $addressFix1 = str_replace("address = ", '', $address);
        $addressFix2 = str_replace("\ncity = ", ', ', $addressFix1);
        $addressFix3 = str_replace("\nstate = ", ', ', $addressFix2);
        $addressFix4 = str_replace("\nzip = ", ' ', $addressFix3);

        return $addressFix4;
    }

    /**
     * Get Field ID by its Name from a Form
     * 
     * @param   string  $name   The Name of the Field
     * @param   string  $formId     The ID of the Form
     */
    public function getFieldByName($name, $formId = '') {
        $jsonObj = json_decode($this->getFormFields($formId));

        foreach ($jsonObj as $field) {
            if (property_exists($field, 'name') && property_exists($field, 'id') && $field->name === $name) {
                return $field->id;
            }
        }
    }

    /**
     * Get Fields IDs Array by its Names from a Form
     * 
     * @param   array   $names  The Names of the Fields
     * @param   string  $formId The ID of the Form
     * 
     * @return  array           Array with the Fields Names
     */
    public function getFieldsByNames($names, $formId = '') {
        $jsonObj = json_decode($this->getFormFields($formId));

        $fieldList = array();

        foreach ($jsonObj as $field) {
            $fieldIndex = array_search($field->name, $names);

            if ($fieldIndex !== false) {
                $fieldList[$names[$fieldIndex]] = $field->id;
            }
        }

        return $fieldList;
    }

}
